# engine/imputer.py
import sys
import os

# Ensure root of the AI engine is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from utils.math_utils import clamp # type: ignore

class Imputer:

    @staticmethod
    def impute(bccv, css, wc, wp, min_val, max_val):
        """
        FIV = (Wc * BCCV) + (Wp * CSS)
        """
        fiv = (wc * bccv) + (wp * css)
        return clamp(fiv, min_val, max_val)