import os
import sys
import math
try:
    import pandas as pd # type: ignore
except ImportError:
    pd = None

# Local imports with type ignores
try:
    from utils.constants import COLUMN_MAPPINGS # type: ignore
except ImportError:
    from .constants import COLUMN_MAPPINGS # type: ignore

def get_cell(row, mapping, key):
    """Get a cell value from a row using the mapping dict."""
    col_name = mapping.get(key)
    if col_name is None:
        return None
    val = row.get(col_name)
    # Safe check for NaN if pandas is missing
    if val is None or (pd is not None and pd.isna(val)) or (isinstance(val, float) and math.isnan(val)):
        return None
    return val

def analyze_columns(df_columns):
    """Map DataFrame column names to standardized schema keys using fuzzy matching."""
    mapped = {}
    used_cols = set()

    # Pass 1: Exact match
    for col in df_columns:
        cleaned = str(col).lower().strip()
        for key, variations in COLUMN_MAPPINGS.items():
            if key in mapped:
                continue
            if cleaned == key.lower() or cleaned in variations:
                mapped[key] = col
                used_cols.add(col)
                break

    # Pass 2: Partial/contains match
    for col in df_columns:
        if col in used_cols:
            continue
        cleaned = str(col).lower().strip()
        for key, variations in COLUMN_MAPPINGS.items():
            if key in mapped:
                continue
            for var in variations:
                if var in cleaned:
                    mapped[key] = col
                    used_cols.add(col)
                    break
            if key in mapped:
                break

    return mapped
