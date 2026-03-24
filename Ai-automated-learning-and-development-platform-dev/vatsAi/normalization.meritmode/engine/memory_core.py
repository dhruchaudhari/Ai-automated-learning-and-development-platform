# engine/memory_core.py
import sys
import os

# Ensure root of the AI engine is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from config import DRIFT_MEMORY_ALPHA # type: ignore

class MemoryCore:

    def __init__(self):
        self.drift_memory = {}

    def update(self, column, actual, predicted, range_val):
        if range_val == 0:
            return

        ids = abs(actual - predicted) / range_val

        if column not in self.drift_memory:
            self.drift_memory[column] = ids
        else:
            prev = self.drift_memory[column]
            new_val = (1 - DRIFT_MEMORY_ALPHA) * prev + DRIFT_MEMORY_ALPHA * ids
            self.drift_memory[column] = new_val

    def get_drift(self, column):
        return self.drift_memory.get(column, 0)