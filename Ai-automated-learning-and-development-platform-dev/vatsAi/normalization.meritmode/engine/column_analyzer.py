# engine/column_analyzer.py
import sys
import os

# Ensure root of the AI engine is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from config import CONFIDENCE_BUFFER # type: ignore
from engine.turbulence import compute_cti # type: ignore

class ColumnAnalyzer:

    def __init__(self, column_name, values):
        self.column_name = column_name
        self.valid_values = [v for v in values if v is not None]

        self.min_val = min(self.valid_values)
        self.max_val = max(self.valid_values)
        self.range_val = self.max_val - self.min_val

        self.n = len(self.valid_values)

        self.cti = compute_cti(self.valid_values)
        self.ccp = self.n / (self.n + CONFIDENCE_BUFFER)
        self.stability_score = self.ccp * (1 - self.cti)