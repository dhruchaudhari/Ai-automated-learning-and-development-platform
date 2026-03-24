"""Simulate the exact stdin/stdout flow that the Node.js backend uses."""
import subprocess, json, sys, os

script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "main.py")

payload = {
    "resume_paths": [],  # empty to test error handling
    "jobs": {
        "j1": {
            "title": "ML Engineer",
            "requiredSkills": ["Python", "TensorFlow"],
            "preferredSkills": ["Docker"],
            "minimumExperience": 2,
            "departmentName": "AI",
            "roleTitle": "ML Engineer",
            "description": "Build ML models",
            "education": "B.Tech CS",
        }
    },
}

proc = subprocess.run(
    [sys.executable, script],
    input=json.dumps(payload),
    capture_output=True,
    text=True,
    timeout=30,
)

print("STDOUT:", proc.stdout[:500])
print("STDERR:", proc.stderr[:500])
print("EXIT CODE:", proc.returncode)

# Parse output
try:
    result = json.loads(proc.stdout)
    print("PARSED:", json.dumps(result, indent=2)[:500])
except Exception as e:
    print(f"PARSE ERROR: {e}")
