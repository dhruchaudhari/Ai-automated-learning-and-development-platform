import sys
import os
import google.generativeai as genai
import re
import json

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import GEMINI_API_KEY

def test():
    print(f"Testing Gemini with Key: {GEMINI_API_KEY[:10]}...")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Use gemini-1.5-flash for better speed/reliability
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Ping. Reply with 'Pong' in JSON format: {'result': 'Pong'}")
        print("Response received!")
        
        # Robust parsing logic
        resp_text = response.text.replace("```json", "").replace("```", "").strip()
        match = re.search(r"\{.*\}", resp_text, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            print(f"Parsed JSON: {data}")
        else:
            print(f"FAILED to find JSON in: {response.text}")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test()
