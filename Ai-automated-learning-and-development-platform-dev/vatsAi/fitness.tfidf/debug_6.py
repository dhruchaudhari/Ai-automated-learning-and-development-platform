import os
import sys
import json
import google.generativeai as genai
import traceback

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import GEMINI_API_KEY

def debug():
    print(f"DEBUG: Key starts with {GEMINI_API_KEY[:5]}")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        
        target_model = 'gemini-2.0-flash'
        print(f"DEBUG: Testing generation with {target_model}...")
        try:
            model = genai.GenerativeModel(target_model)
            response = model.generate_content("Hello. Reply JSON: {'status': 'ok'}")
            print(f"DEBUG: Success! Response: {response.text}")
        except Exception as ge:
            print(f"DEBUG: Generation failed with {target_model}: {ge}")
            print(traceback.format_exc())
            
    except Exception as e:
        print(f"DEBUG: Critical Error: {e}")
        print(traceback.format_exc())

if __name__ == "__main__":
    debug()
