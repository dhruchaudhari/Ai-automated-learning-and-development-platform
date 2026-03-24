"""
Fitness TF-IDF Engine – stdin/stdout bridge.
Receives resume file paths + job data via stdin JSON,
outputs fitness scores via stdout JSON.

Same interface pattern as vatsAi/fitness/run_fitness.py.
"""

import sys
import json
import traceback
import os

# Ensure local imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.pdf_parser import PDFParser
from core.resume_analyzer import ResumeAnalyzer
from core.fitness_scorer import FitnessScorer
from config import ENGINE_VERSION


def main():
    try:
        raw = sys.stdin.read()
        if not raw:
            print(json.dumps({"success": False, "error": "Empty input"}))
            return

        data = json.loads(raw)
        resume_paths = data.get("resume_paths", [])
        jobs = data.get("jobs", {})

        if not resume_paths:
            print(json.dumps({"success": False, "error": "No resume paths provided"}))
            return

        if not jobs:
            print(json.dumps({"success": False, "error": "No jobs provided"}))
            return

        # ── Step 1: Extract text from all PDFs ──
        sys.stderr.write(f"[TF-IDF Engine] Parsing {len(resume_paths)} PDFs...\n")
        parsed_pdfs = PDFParser.batch_extract(resume_paths)

        # ── Step 2: Analyze each resume ──
        sys.stderr.write("[TF-IDF Engine] Analyzing resumes...\n")
        analyzer = ResumeAnalyzer()
        resume_data_list = []
        resume_file_map = []

        for parsed in parsed_pdfs:
            analysis = analyzer.analyze(parsed["text"])
            analysis["resumeFile"] = parsed["filename"]
            resume_data_list.append(analysis)
            resume_file_map.append(parsed["filename"])

        # ── Step 3: Compute fitness scores ──
        sys.stderr.write(
            f"[TF-IDF Engine] Computing fitness for {len(resume_data_list)} resumes × {len(jobs)} jobs...\n"
        )
        scorer = FitnessScorer()
        results = scorer.score_all(resume_data_list, jobs)

        # ── Step 4: Attach resume filenames ──
        for i, result in enumerate(results):
            result["resumeFile"] = resume_file_map[i]

        # ── Step 5: Compute engine metrics ──
        all_scores = []
        for r in results:
            for jid, jdata in r.get("fitnessByJob", {}).items():
                all_scores.append(jdata["score"])

        metrics = {
            "totalResumes": len(resume_data_list),
            "totalJobs": len(jobs),
            "totalPairs": len(all_scores),
            "avgFitness": round(sum(all_scores) / max(len(all_scores), 1), 4),
            "maxFitness": round(max(all_scores), 4) if all_scores else 0,
            "minFitness": round(min(all_scores), 4) if all_scores else 0,
        }

        output = {
            "success": True,
            "results": results,
            "engineMetrics": metrics,
            "engineVersion": ENGINE_VERSION,
        }

        sys.stderr.write(
            f"[TF-IDF Engine] Complete. {metrics['totalPairs']} fitness pairs computed.\n"
        )
        print(json.dumps(output))

    except Exception as e:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                }
            )
        )


if __name__ == "__main__":
    main()
