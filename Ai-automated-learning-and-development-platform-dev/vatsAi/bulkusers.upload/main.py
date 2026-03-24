import os
import sys
import json

# Add current directory to path for runtime execution
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import from core package - type ignore to suppress IDE visibility issues
try:
    from core.processor import process_file # type: ignore
except ImportError:
    from .core.processor import process_file # type: ignore

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "message": "No file path provided to the processor."}))
        sys.exit(1)

    result = process_file(sys.argv[1])
    print(json.dumps(result))
