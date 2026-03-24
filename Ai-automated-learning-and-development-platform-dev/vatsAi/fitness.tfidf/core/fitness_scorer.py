"""
core/fitness_scorer.py – Supreme 7.1 Hybrid Scoring Layer.
Robust local TF-IDF + skill overlap scoring that ALWAYS works, with optional Gemini boost.
"""

import re
import json
import sys
import os
import math
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import (
    GEMINI_API_KEY, USE_GEMINI, ENGINE_VERSION,
    LAMBDA_EXP, MAX_EXP_YEARS,
    INITIAL_FEATURE_WEIGHTS,
)

# Optional Gemini
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False


class FitnessScorer:
    """Hybrid local + Gemini fitness scoring engine."""

    def __init__(self):
        self.weights = list(INITIAL_FEATURE_WEIGHTS)
        self.gemini_model = None
        if USE_GEMINI and HAS_GENAI and GEMINI_API_KEY:
            try:
                genai.configure(api_key=GEMINI_API_KEY)
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
                sys.stderr.write("[Scorer] Gemini enhancer ready.\n")
            except Exception as e:
                sys.stderr.write(f"[Scorer] Gemini setup failed, using local only: {e}\n")

    def score_all(self, resume_data_list: list, jobs: dict) -> list:
        if not resume_data_list or not jobs:
            return []

        job_ids = list(jobs.keys())
        results = []

        for ri, rd in enumerate(resume_data_list):
            result_entry = {
                "resumeIndex": ri,
                "candidateName": rd.get("candidateName", "Unknown"),
                "extractedData": {
                    "skills": rd.get("skills", []),
                    "education": rd.get("education", []),
                    "summary": rd.get("summary", ""),
                },
                "fitnessByJob": {},
            }

            for jid in job_ids:
                job = jobs[jid]
                components = self._compute_components(rd, job)
                score = self._weighted_score(components)

                result_entry["fitnessByJob"][jid] = {
                    "score": round(score, 4),
                    "components": components,
                    "jobCode": job.get("jobCode", ""),
                    "roleTitle": job.get("roleTitle", ""),
                    "departmentName": job.get("departmentName", ""),
                }

            results.append(result_entry)

        # Gemini enhancement disabled – local scoring is sufficient for 5k+ scale
        # if self.gemini_model and results:
        #     self._try_gemini_enhance(results, resume_data_list, jobs)

        return results

    # ───────── LOCAL SCORING ─────────
    def _compute_components(self, rd: dict, job: dict) -> dict:
        return {
            "skillOverlap": self._skill_overlap(rd, job),
            "educationMatch": self._education_match(rd, job),
        }

    def _skill_overlap(self, rd: dict, job: dict) -> float:
        resume_skills = set(s.lower() for s in rd.get("skills", []))
        required = set(s.lower() for s in job.get("requiredSkills", []))
        preferred = set(s.lower() for s in job.get("preferredSkills", []))

        all_job_skills = required | preferred
        if not all_job_skills:
            return 0.5  # No requirements = neutral

        matched = resume_skills & all_job_skills
        # Weight required skills more
        req_matched = len(resume_skills & required) / max(len(required), 1)
        pref_matched = len(resume_skills & preferred) / max(len(preferred), 1)

        return round(min(0.7 * req_matched + 0.3 * pref_matched, 1.0), 4)

    def _education_match(self, rd: dict, job: dict) -> float:
        """Deep education matching: 10th/12th/UG/PG hierarchy + field matching.
        This is a DOMINANT factor (45% weight) in Supreme 7.1.
        """
        education = rd.get("education", [])
        raw_text = rd.get("raw_text", "")
        job_edu = job.get("education", "")
        job_skills = [s.lower() for s in job.get("requiredSkills", [])]

        if not education and not raw_text:
            return 0.1

        edu_text = (" ".join(education) + " " + raw_text).lower()

        score = 0.0

        # ── Level Detection (hierarchical) ──
        # 10th / SSC / Secondary
        has_10th = any(kw in edu_text for kw in [
            "10th", "ssc", "secondary school", "matriculation", "class 10",
            "class x", "high school", "10 th"
        ])
        # 12th / HSC / Senior Secondary
        has_12th = any(kw in edu_text for kw in [
            "12th", "hsc", "senior secondary", "intermediate", "class 12",
            "class xii", "higher secondary", "12 th", "puc", "pre-university"
        ])
        # UG / Bachelor / Diploma
        has_ug = any(kw in edu_text for kw in [
            "b.tech", "btech", "b.e.", "b.e ", "bachelor", "bsc", "b.sc",
            "bba", "bcom", "b.com", "bca", "b.c.a", "ba ", "b.a.",
            "diploma", "undergraduate", "ug ", "degree"
        ])
        # PG / Master
        has_pg = any(kw in edu_text for kw in [
            "m.tech", "mtech", "m.e.", "master", "msc", "m.sc",
            "mba", "mcom", "m.com", "mca", "m.c.a", "ma ", "m.a.",
            "postgraduate", "pg ", "post graduate"
        ])
        # PhD / Doctorate
        has_phd = any(kw in edu_text for kw in [
            "phd", "ph.d", "doctorate", "doctoral", "research scholar"
        ])

        # Hierarchical scoring (higher degree = higher base score)
        if has_phd:
            score = 0.95
        elif has_pg:
            score = 0.85
        elif has_ug:
            score = 0.70
        elif has_12th:
            score = 0.45
        elif has_10th:
            score = 0.30
        else:
            score = 0.15

        # ── Field/Specialization Bonus ──
        # Check if candidate's education field aligns with job requirements
        tech_fields = ["computer", "software", "information technology", "it ",
                       "electronics", "electrical", "mechanical", "civil",
                       "data science", "artificial intelligence", "cybersecurity"]
        mgmt_fields = ["management", "business", "commerce", "finance", "marketing",
                        "human resource", "hr ", "accounting"]

        job_title_lower = job.get("title", "").lower()
        field_bonus = 0.0

        for field in tech_fields:
            if field in edu_text and any(sk in job_title_lower or sk in " ".join(job_skills)
                                         for sk in ["python", "java", "react", "node", "ml", "ai",
                                                     "developer", "engineer", "software", "data"]):
                field_bonus = 0.10
                break

        for field in mgmt_fields:
            if field in edu_text and any(sk in job_title_lower or sk in " ".join(job_skills)
                                         for sk in ["manager", "lead", "business", "analyst",
                                                     "marketing", "finance", "hr"]):
                field_bonus = 0.10
                break

        return round(min(score + field_bonus, 1.0), 4)

    def _weighted_score(self, components: dict) -> float:
        keys = ["skillOverlap", "educationMatch"]
        total = sum(
            self.weights[i] * components.get(keys[i], 0)
            for i in range(min(len(keys), len(self.weights)))
        )
        return round(min(max(total, 0.0), 1.0), 4)

    def _tokenize(self, text: str) -> list:
        return [w for w in re.findall(r"[a-z0-9+#.]+", text.lower()) if len(w) > 1]

    # ───────── GEMINI ENHANCEMENT (optional, non-blocking) ─────────
    def _try_gemini_enhance(self, results: list, resume_data_list: list, jobs: dict):
        """Attempt a single Gemini call to refine the first result. Non-fatal."""
        try:
            rd = resume_data_list[0]
            first_jid = list(jobs.keys())[0]
            job = jobs[first_jid]

            prompt = f"""Rate candidate fitness 0.0-1.0. Return JSON only: {{"score":float,"rationale":"2 sentences"}}
Candidate skills: {rd.get('skills',[])}
Job: {job.get('title','')} requires {job.get('requiredSkills',[])}"""

            response = self.gemini_model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            m = re.search(r"\{.*\}", text, re.DOTALL)
            if m:
                data = json.loads(m.group(0))
                g_score = max(0.0, min(1.0, float(data.get("score", 0))))
                rationale = data.get("rationale", "")
                # Blend: 70% local, 30% Gemini
                local_score = results[0]["fitnessByJob"][first_jid]["score"]
                blended = round(0.7 * local_score + 0.3 * g_score, 4)
                results[0]["fitnessByJob"][first_jid]["score"] = blended
                if rationale:
                    results[0]["fitnessByJob"][first_jid]["explanation"] += f"\n\n🤖 **Gemini Insight:** {rationale}"
                sys.stderr.write(f"[Scorer] Gemini enhanced first result: {local_score} -> {blended}\n")
        except Exception as e:
            sys.stderr.write(f"[Scorer] Gemini enhance skipped: {e}\n")


