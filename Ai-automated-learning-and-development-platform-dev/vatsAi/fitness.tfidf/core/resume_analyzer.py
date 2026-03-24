"""
core/resume_analyzer.py – Supreme 7.1 Hybrid Extraction Layer.
Robust local NLP extraction with local BART summarization.
Gemini has been removed from per-resume loops to avoid 429 quota limits.
"""

import re
import sys
import os
import json
import time
import math
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import (
    GEMINI_API_KEY, USE_GEMINI,
    SECTION_PATTERNS, DATE_RANGE_PATTERNS,
    TECH_BLACKLIST, COMMON_TECH_WHITELIST, CERT_KEYWORDS,
)

# Local BART model (replaces Gemini for summaries)
try:
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False

try:
    import spacy
    HAS_SPACY = True
except ImportError:
    HAS_SPACY = False

try:
    from rake_nltk import Rake
    HAS_RAKE = True
except ImportError:
    HAS_RAKE = False


class ResumeAnalyzer:
    """Extract structured data from resume text using local NLP + BART summarization."""

    def __init__(self):
        # ── spaCy + RAKE ──
        self.nlp = None
        self.rake = None
        if HAS_SPACY:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except:
                import subprocess
                subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
                self.nlp = spacy.load("en_core_web_sm")
        if HAS_RAKE:
            self.rake = Rake()

        # ── Local BART summarizer (replaces Gemini) ──
        self.bart_model = None
        self.bart_tokenizer = None
        if HAS_TRANSFORMERS:
            try:
                model_name = "sshleifer/distilbart-cnn-12-6"
                sys.stderr.write(f"[Analyzer] Loading local BART ({model_name})...\n")
                # Try local cache first (instant, no network)
                try:
                    self.bart_tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=True)
                    self.bart_model = AutoModelForSeq2SeqLM.from_pretrained(model_name, local_files_only=True)
                except Exception:
                    # First run: download from HuggingFace
                    sys.stderr.write("[Analyzer] BART not cached, downloading...\n")
                    self.bart_tokenizer = AutoTokenizer.from_pretrained(model_name)
                    self.bart_model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
                sys.stderr.write("[Analyzer] Local BART ready.\n")
            except Exception as e:
                sys.stderr.write(f"[Analyzer] BART load failed, summaries will use fallback: {e}\n")

    # ───────── PUBLIC ─────────
    def analyze(self, raw_text: str) -> dict:
        """Main entry point: local extraction + BART summary enhancement."""
        result = self._local_extract(raw_text)

        # Use Local BART for summary & highlights (no Gemini, no rate limits)
        if self.bart_model is not None:
            local_llm_data = self._local_llm_extract(raw_text)
            if local_llm_data:
                result = self._merge(result, local_llm_data)

        return result

    # ───────── LOCAL EXTRACTION ─────────
    def _local_extract(self, text: str) -> dict:
        sections = self._detect_sections(text)
        name = self._extract_name(text)
        skills = self._extract_skills(text, sections.get("skills", ""))
        exp_years = self._extract_experience_years(text)
        projects = self._extract_projects(sections.get("projects", ""))
        education = self._extract_education(sections.get("education", ""))
        certs = self._extract_certifications(text, sections.get("certifications", ""))
        summary = self._extract_summary(text, sections.get("summary", ""))

        return {
            "candidateName": name,
            "skills": skills,
            "experienceYears": exp_years,
            "projects": projects,
            "education": education,
            "certifications": certs,
            "summary": summary,
            "raw_text": text,
        }

    def _detect_sections(self, text: str) -> dict:
        lines = text.split("\n")
        sections = {}
        current_section = None
        current_lines = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            matched = False
            for sec_name, patterns in SECTION_PATTERNS.items():
                for pat in patterns:
                    if re.search(pat, stripped) and len(stripped) < 60:
                        if current_section:
                            sections[current_section] = "\n".join(current_lines)
                        current_section = sec_name
                        current_lines = []
                        matched = True
                        break
                if matched:
                    break
            if not matched and current_section:
                current_lines.append(stripped)

        if current_section:
            sections[current_section] = "\n".join(current_lines)
        return sections

    def _extract_name(self, text: str) -> str:
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for line in lines[:5]:
            # Skip lines that look like headers/labels
            if re.search(r"(?i)(resume|curriculum|vitae|objective|summary|profile|contact)", line):
                continue
            # Name pattern: 2-4 capitalized words
            m = re.match(r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$", line)
            if m:
                return m.group(1)
        # Fallback: first non-empty line as name
        if lines:
            candidate = lines[0].strip()
            if len(candidate) < 40 and not re.search(r"[0-9@]", candidate):
                return candidate
        return "Unknown"

    def _extract_skills(self, full_text: str, skills_section: str) -> list:
        found = set()
        search_text = (skills_section + " " + full_text).lower()

        # Match from whitelist
        for skill in COMMON_TECH_WHITELIST:
            if skill in search_text:
                found.add(skill.title() if len(skill) > 3 else skill.upper())

        # Extract comma/pipe separated items from skills section
        if skills_section:
            items = re.split(r"[,|•·►▪●\n]+", skills_section)
            for item in items:
                clean = item.strip().strip("-•● ")
                if clean and len(clean) > 1 and len(clean) < 40:
                    if clean.lower() not in TECH_BLACKLIST:
                        found.add(clean.title())

        return sorted(list(found))[:30]

    def _extract_experience_years(self, text: str) -> float:
        total_months = 0
        now = datetime.now()

        for pattern in DATE_RANGE_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    start_str = match[0].strip()
                    end_str = match[1].strip()

                    start_year = int(re.search(r"((?:19|20)\d{2})", start_str).group(1))
                    if re.search(r"(?i)present|current", end_str):
                        end_year = now.year
                    else:
                        end_year = int(re.search(r"((?:19|20)\d{2})", end_str).group(1))

                    diff = end_year - start_year
                    if 0 < diff < 50:
                        total_months += diff * 12
                except Exception:
                    continue

        years = total_months / 12.0
        # Sanity cap
        return round(min(years, 30.0), 1)

    def _extract_projects(self, section: str) -> list:
        if not section:
            return []
        # Split by numbered items or bullet points
        items = re.split(r"\n(?=\d+\.|\•|►|▪|●|-\s)", section)
        projects = []
        for item in items:
            clean = item.strip().strip("-•● ")
            if clean and len(clean) > 10:
                projects.append(clean[:200])
        return projects[:5]

    def _extract_education(self, section: str) -> list:
        if not section:
            return []
        edu = []
        lines = section.split("\n")
        for line in lines:
            clean = line.strip()
            if clean and len(clean) > 5:
                edu.append(clean[:150])
        return edu[:5]

    def _extract_certifications(self, full_text: str, section: str) -> list:
        certs = []
        search = section if section else full_text
        lines = search.split("\n")
        for line in lines:
            lower = line.lower()
            if any(kw in lower for kw in CERT_KEYWORDS):
                clean = line.strip().strip("-•● ")
                if clean and len(clean) > 5:
                    certs.append(clean[:150])
        return certs[:10]

    def _extract_summary(self, full_text: str, section: str) -> str:
        """Generate a structured summary from locally extracted data."""
        if section and len(section.strip()) > 30:
            return section[:500]
        # Build a basic summary from the first meaningful lines
        lines = [l.strip() for l in full_text.split("\n") if l.strip() and len(l.strip()) > 20]
        return " ".join(lines[:3])[:500]

    # ───────── LOCAL LLM (BART) ENHANCEMENT ─────────
    def _local_llm_extract(self, text: str) -> dict:
        """Generate a single brief professional summary using local BART."""
        try:
            input_text = text[:3000]
            inputs = self.bart_tokenizer(
                input_text, return_tensors="pt",
                max_length=1024, truncation=True
            )
            summary_ids = self.bart_model.generate(
                inputs["input_ids"],
                max_length=70, min_length=15,
                length_penalty=2.0, num_beams=4,
                repetition_penalty=1.5,
                early_stopping=True
            )
            summary_text = self.bart_tokenizer.decode(
                summary_ids[0], skip_special_tokens=True
            ).strip()

            return {"structured_summary": f"**Professional Summary**\n{summary_text}"}

        except Exception as e:
            sys.stderr.write(f"[Analyzer] Local BART extraction failed: {e}\n")
            return None

    # ───────── GEMINI ENHANCEMENT (DEPRECATED FOR LOCAL) ─────────
    def _gemini_extract(self, text: str) -> dict:
        """Deprecated: Local BART is used instead to avoid 429 quota limits."""
        pass

    def _merge(self, local: dict, gemini: dict) -> dict:
        """Merge Gemini data into local result, preferring richer data."""
        merged = dict(local)
        # Prefer Gemini name if it found one
        g_name = gemini.get("candidateName", "")
        if g_name and g_name != "Unknown" and len(g_name) > 2:
            merged["candidateName"] = g_name
        # Union skills
        local_skills = set(s.lower() for s in local.get("skills", []))
        for s in gemini.get("skills", []):
            if s.lower() not in local_skills:
                merged["skills"].append(s)
        # Keep higher experience
        g_exp = float(gemini.get("experienceYears", 0))
        if g_exp > merged["experienceYears"]:
            merged["experienceYears"] = g_exp
        # Union projects
        if gemini.get("projects") and len(gemini["projects"]) > len(merged["projects"]):
            merged["projects"] = gemini["projects"]
        # Union education
        if gemini.get("education") and len(gemini["education"]) > len(merged["education"]):
            merged["education"] = gemini["education"]
        # Union certs
        if gemini.get("certifications") and len(gemini["certifications"]) > len(merged["certifications"]):
            merged["certifications"] = gemini["certifications"]
            
        # ALWAYS prefer Gemini's structured summary since it's far superior to local fallback
        g_sum = gemini.get("structured_summary", "")
        if g_sum and len(g_sum) > 20:
            merged["summary"] = g_sum
            
        return merged

    def _empty_result(self, raw_text: str) -> dict:
        return {
            "candidateName": "Unknown",
            "skills": [],
            "experienceYears": 0.0,
            "projects": [],
            "education": [],
            "certifications": [],
            "summary": "",
            "raw_text": raw_text,
        }
