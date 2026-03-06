import os
import sys
import re
import math
import json
from datetime import datetime

try:
    import pandas as pd # type: ignore
except ImportError:
    pd = None

# Local imports with type ignores
try:
    from utils.constants import CURRENT_YEAR # type: ignore
except ImportError:
    from .constants import CURRENT_YEAR # type: ignore

def clean_str(val):
    """Safely convert any value to a stripped string. Returns empty string for NaN/None."""
    if val is None:
        return ""
    if isinstance(val, float) and math.isnan(val):
        return ""
    return str(val).strip()

def safe_float(val):
    try:
        if val is None or (isinstance(val, float) and math.isnan(val)):
            return 0.0
        return float(clean_str(val).replace('%', ''))
    except Exception:
        return 0.0

def safe_int(val):
    try:
        if val is None or (isinstance(val, float) and math.isnan(val)):
            return 0
        return int(float(val))
    except Exception:
        return 0

def validate_full_name(val):
    s = clean_str(val)
    if not s:
        return "Full name is required"
    if len(s) < 3:
        return "Full name must be at least 3 characters"
    if len(s) > 100:
        return "Full name is too long (max 100 characters)"
    if not re.match(r'^[A-Za-z\s.]+$', s):
        return "Full name should contain only letters, spaces, and dots"
    return ""

def validate_fathers_name(val):
    s = clean_str(val)
    if not s:
        return "Father's name is required"
    if len(s) < 3:
        return "Father's name must be at least 3 characters"
    if len(s) > 100:
        return "Father's name is too long (max 100 characters)"
    if not re.match(r'^[A-Za-z\s.]+$', s):
        return "Father's name should contain only letters, spaces, and dots"
    return ""

def validate_email(val):
    s = clean_str(val).lower()
    if not s:
        return "Email is required"
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', s):
        return "Please enter a valid email address (e.g., user@example.com)"
    if len(s) > 254:
        return "Email is too long (max 254 characters)"
    if '..' in s:
        return "Email contains consecutive dots"
    if s.startswith('.') or s.endswith('.'):
        return "Email cannot start or end with a dot"
    return ""

def validate_mobile(val):
    s = clean_str(val)
    if not s:
        return "Mobile number is required"
    clean_phone = re.sub(r'\D', '', s)
    
    # Handle optional +91 or 91 prefix
    if len(clean_phone) == 12 and clean_phone.startswith('91'):
        clean_phone = clean_phone[2:]
        
    if len(clean_phone) != 10:
        return "India phone numbers must have 10 digits"
    if not re.match(r'^[6-9]\d{9}$', clean_phone):
        return "Invalid India number. Must start with 6, 7, 8, or 9"
    return ""

def validate_gender(val):
    s = clean_str(val).lower()
    if not s:
        return "Gender is required"
    if s.startswith('m') or s.startswith('f') or s.startswith('o'):
        return ""
    return "Gender must be Male, Female, or Other"

def resolve_gender(val):
    s = clean_str(val).lower()
    if s.startswith('m'): return 'Male'
    if s.startswith('f'): return 'Female'
    if s.startswith('o'): return 'Other'
    return ''

def validate_dob(val):
    if val is None:
        return "Date of Birth is required"
    try:
        if isinstance(val, datetime):
            if val > datetime.now():
                return "Date of birth cannot be in the future"
            return ""
        
        # Safe pandas check
        if pd is not None:
            parsed = pd.to_datetime(val)
        else:
            # Fallback to standard library for simple strings if pandas missing
            from datetime import date
            if isinstance(val, str):
                parsed = datetime.fromisoformat(val.split('T')[0])
            else:
                parsed = val # Hope for the best
                
        if parsed > datetime.now():
            return "Date of birth cannot be in the future"
        return ""
    except Exception:
        return "Please enter a valid date of birth"

def parse_dob(val):
    try:
        if isinstance(val, datetime):
            return val.isoformat()
        if pd is not None:
            return pd.to_datetime(val).isoformat()
        return str(val) # Fallback
    except Exception:
        return None

def validate_password(val):
    s = clean_str(val)
    if not s:
        return "Password is required"
    if len(s) < 8:
        return "Password must be at least 8 characters long"
    return ""

def validate_address(val):
    s = clean_str(val)
    if not s:
        return "Permanent address is required"
    if len(s) < 10:
        return "Address must be at least 10 characters long"
    if len(s) > 500:
        return "Address cannot exceed 500 characters"
    return ""

def validate_state(val):
    if not clean_str(val):
        return "State is required"
    return ""

def validate_board(val, label):
    if not clean_str(val):
        return f"{label} is required"
    return ""

def validate_passing_year(val, label):
    s = clean_str(val)
    if not s: return f"{label} is required"
    try:
        year = int(float(s))
        if year < 1950 or year > CURRENT_YEAR:
            return f"{label}: Year must be between 1950 and {CURRENT_YEAR}"
        return ""
    except Exception:
        return f"{label}: Please enter a valid year"

def validate_percentage(val, label):
    s = clean_str(val).replace('%', '')
    if not s: return f"{label} is required"
    try:
        pct = float(s)
        if pct < 0 or pct > 100:
            return f"{label}: Percentage must be between 0 and 100"
        return ""
    except Exception:
        return f"{label}: Please enter a valid percentage"

def validate_graduation_degree(val):
    if not clean_str(val): return "Graduation Degree is required"
    return ""

def validate_graduation_specialization(val):
    if not clean_str(val): return "Graduation Specialization is required"
    return ""

def validate_cgpa_optional(val):
    s = clean_str(val)
    if not s: return ""
    try:
        cgpa = float(s)
        if cgpa < 0 or cgpa > 10:
            return "CGPA must be between 0 and 10"
        return ""
    except Exception:
        return "Please enter a valid CGPA"

def validate_qualifying_degree(val):
    # Optional field
    return ""

def validate_qualifying_specialization(val):
    # Optional field
    return ""

def validate_skills(val, label):
    s = clean_str(val)
    if not s:
        return f"At least one {label.lower()} is required"
    return ""

def validate_advertisements(val):
    s = clean_str(val)
    if not s:
        return "At least one advertisement must be selected"
    return ""

def validate_file_reference(val, label):
    s = clean_str(val)
    if not s:
        return f"{label} is required"
    return ""

def parse_skills(val):
    if not val: return []
    if isinstance(val, (list, tuple)): return [str(x).strip() for x in val if x]
    return [s.strip() for s in str(val).split(',') if s.strip()]

def parse_advertisements(val):
    if not val: return []
    # If it's already a list of IDs or names
    if isinstance(val, (list, tuple)): return [str(x).strip() for x in val if x]
    # Split by comma or semicolon
    return [s.strip() for s in re.split(r'[,;]', str(val)) if s.strip()]
