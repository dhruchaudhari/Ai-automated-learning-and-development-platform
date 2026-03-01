# engine/weight_engine.py
import sys
import os

# Ensure root of the AI engine is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from config import DEFAULT_WC, DEFAULT_WP, MIN_WP, MAX_WP # type: ignore

class WeightEngine:

    @staticmethod
    def compute_weights(stability_score):
        """
        Adaptive personal weight calculation
        """
        wp = DEFAULT_WP * stability_score

        if wp < MIN_WP:
            wp = MIN_WP
        if wp > MAX_WP:
            wp = MAX_WP

        wc = 1 - wp
        return wc, wp