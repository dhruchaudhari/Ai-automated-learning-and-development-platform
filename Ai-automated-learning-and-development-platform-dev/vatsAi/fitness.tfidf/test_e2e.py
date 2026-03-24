"""End-to-end pipeline test for Supreme 7.1 Hybrid Engine."""
import sys, os, json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.resume_analyzer import ResumeAnalyzer
from core.fitness_scorer import FitnessScorer
from config import ENGINE_VERSION

# Simulated resume text
RESUME_TEXT = """
Vandit Mehta
Email: vandit@example.com | Phone: +91-9876543210

SUMMARY
Experienced full-stack developer with 3 years of experience in Python, React, Node.js.

SKILLS
Python, JavaScript, React, Node.js, MongoDB, Express, Git, Docker, REST API, Machine Learning, TensorFlow

EXPERIENCE
Software Developer at TechCorp (Jan 2021 - Present)
- Built scalable REST APIs using Node.js and Express
- Developed React dashboards with Redux state management

Junior Developer at StartupXYZ (Jun 2019 - Dec 2020)
- Python backend development with Flask
- MongoDB database design and optimization

PROJECTS
1. AI Resume Analyzer - Built an ML-powered resume parsing system using Python and TensorFlow
2. E-Commerce Platform - Full-stack React + Node.js marketplace with payment integration

EDUCATION
B.Tech in Computer Science from Gujarat University (2019)

CERTIFICATIONS
AWS Certified Cloud Practitioner
Google TensorFlow Developer Certificate
"""

# Simulated jobs (like the backend sends)
JOBS = {
    "job_001": {
        "title": "Junior ML Engineer",
        "jobCode": "ML-101",
        "description": "Build and deploy machine learning models",
        "requiredSkills": ["Python", "TensorFlow", "Machine Learning"],
        "preferredSkills": ["Docker", "AWS", "REST API"],
        "minimumExperience": 2,
        "education": "B.Tech Computer Science",
        "departmentName": "AI Research",
        "roleTitle": "Junior ML Engineer",
    },
    "job_002": {
        "title": "Backend Python Developer",
        "jobCode": "PY-102",
        "description": "Develop scalable backend services",
        "requiredSkills": ["Python", "Flask", "MongoDB", "REST API"],
        "preferredSkills": ["Docker", "Git", "Redis"],
        "minimumExperience": 1,
        "education": "B.Tech",
        "departmentName": "Engineering",
        "roleTitle": "Backend Python Developer",
    },
}

print(f"=== Supreme 7.1 Hybrid Engine Test (v{ENGINE_VERSION}) ===\n")

# Step 1: Analyze
print("STEP 1: Analyzing resume...")
analyzer = ResumeAnalyzer()
result = analyzer.analyze(RESUME_TEXT)
print(f"  Name: {result['candidateName']}")
print(f"  Skills ({len(result['skills'])}): {result['skills'][:10]}")
print(f"  Education: {result['education']}")


# Step 2: Score
print("\nSTEP 2: Computing fitness scores...")
scorer = FitnessScorer()
scores = scorer.score_all([result], JOBS)

for r in scores:
    print(f"\n  Candidate: {r['candidateName']}")
    for jid, jdata in r['fitnessByJob'].items():
        print(f"  Job: {jdata.get('jobCode','')} ({jdata.get('departmentName','')})")
        print(f"    Score: {jdata['score']*100:.1f}%")
        print(f"    Components: {json.dumps(jdata['components'], indent=6)}")

print("\n=== TEST COMPLETE ===")
