"""Quick single-call test to verify Gemini key & model work."""
import sys, os, json, re, time, traceback
import google.generativeai as genai

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import GEMINI_API_KEY

print("=== Gemini Single-Call Test ===")
print(f"Key: ...{GEMINI_API_KEY[-6:]}")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

# Wait 10 seconds to let any rate limit window reset
print("Waiting 10s for rate limit window reset...")
time.sleep(10)

try:
    resp = model.generate_content(
        'Return ONLY this JSON: {"candidateName":"John Doe","skills":["Python","React"],"experienceYears":3.5}'
    )
    print(f"RAW RESPONSE:\n{resp.text}")
    
    clean = resp.text.replace("```json","").replace("```","").strip()
    m = re.search(r"\{.*\}", clean, re.DOTALL)
    if m:
        data = json.loads(m.group(0))
        print(f"\nPARSED OK: {json.dumps(data, indent=2)}")
    else:
        print(f"\nFAILED TO PARSE JSON from response")
except Exception as e:
    print(f"ERROR: {e}")
    traceback.print_exc()
