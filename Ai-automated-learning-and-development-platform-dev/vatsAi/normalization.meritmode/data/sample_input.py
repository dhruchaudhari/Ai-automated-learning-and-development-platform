# data/sample_input.py
import sys
import os

# Ensure root of the AI engine is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from models.candidate import Candidate # type: ignore

def load_sample():
    return [
        Candidate("C1", {"10th": 92, "12th": None, "Grad": None, "PG": None}),
        Candidate("C2", {"10th": 75, "12th": 80, "Grad": None, "PG": None}),
        Candidate("C3", {"10th": 68, "12th": 72, "Grad": 74, "PG": None}),
        Candidate("C4", {"10th": 60, "12th": 65, "Grad": 70, "PG": 81}),
        Candidate("C5", {"10th": 95, "12th": 55, "Grad": 58, "PG": 62}),
    ]