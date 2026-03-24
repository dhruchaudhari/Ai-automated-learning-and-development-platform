import os
import sys
import json
import re
import math
from typing import List

# Setup search path
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    import pandas as pd # type: ignore
except ImportError:
    pd = None

# Absolute imports with type ignores for linter
try:
    from utils.mapping import get_cell, analyze_columns # type: ignore
    from utils.validators import ( # type: ignore
        clean_str, safe_float, safe_int, validate_full_name,
        validate_fathers_name, validate_email, validate_mobile,
        validate_gender, resolve_gender, validate_dob, parse_dob,
        validate_password, validate_address, validate_state,
        validate_board, validate_passing_year, validate_percentage,
        validate_graduation_degree, validate_graduation_specialization,
        validate_cgpa_optional, validate_qualifying_degree,
        validate_qualifying_specialization, validate_skills,
        validate_advertisements, validate_file_reference,
        parse_skills, parse_advertisements
    )
except ImportError:
    from ..utils.mapping import get_cell, analyze_columns # type: ignore
    from ..utils.validators import ( # type: ignore
        clean_str, safe_float, safe_int, validate_full_name,
        validate_fathers_name, validate_email, validate_mobile,
        validate_gender, resolve_gender, validate_dob, parse_dob,
        validate_password, validate_address, validate_state,
        validate_board, validate_passing_year, validate_percentage,
        validate_graduation_degree, validate_graduation_specialization,
        validate_cgpa_optional, validate_qualifying_degree,
        validate_qualifying_specialization, validate_skills,
        validate_advertisements, validate_file_reference,
        parse_skills, parse_advertisements
    )

def validate_and_build_record(row, mapping, row_number):
    """
    Validate a single Excel row with STRICT Register.jsx rules.
    Returns (record_dict_or_None, field_errors_dict, original_row_data).
    """
    field_errors = {}
    
    # Get all raw data for the modal (preserve all original columns)
    original_data = {}
    for col in row.index:
        val = row.get(col)
        if val is None or (isinstance(val, float) and math.isnan(val)):
            original_data[str(col)] = ""
        else:
            original_data[str(col)] = str(val).strip()

    # --- REQUIRED PERSONAL FIELDS ---
    def check(key, validator, label=None):
        val = get_cell(row, mapping, key)
        err = validator(val, label) if label else validator(val)
        if err:
            field_errors[key] = err

    check('fullName', validate_full_name)
    check('fathersName', validate_fathers_name)
    check('email', validate_email)
    check('mobile', validate_mobile)
    check('gender', validate_gender)
    check('dob', validate_dob)
    check('password', validate_password)
    check('permanentAddress', validate_address)
    check('state', validate_state)

    # Education
    check('tenthBoard', validate_board, '10th Board')
    check('tenthPassingYear', validate_passing_year, '10th Passing Year')
    check('tenthPercentage', validate_percentage, '10th Percentage')
    check('tenthMarksheet', validate_file_reference, '10th Marksheet')
    
    check('twelfthBoard', validate_board, '12th Board')
    check('twelfthPassingYear', validate_passing_year, '12th Passing Year')
    check('twelfthPercentage', validate_percentage, '12th Percentage')
    check('twelfthMarksheet', validate_file_reference, '12th Marksheet')
    
    check('graduationDegree', validate_graduation_degree)
    check('graduationSpecialization', validate_graduation_specialization)
    check('graduationPassingYear', validate_passing_year, 'Graduation Passing Year')
    check('graduationMarksheet', validate_file_reference, 'Graduation Marksheet')
    
    # Grad Percentage/CGPA combined check (Must have at least one)
    grad_pct = get_cell(row, mapping, 'graduationPercentage')
    grad_cgpa = get_cell(row, mapping, 'graduationCGPA')
    if not clean_str(grad_pct) and not clean_str(grad_cgpa):
        field_errors['graduationPercentage'] = "Graduation Percentage or CGPA is required"
    else:
        if clean_str(grad_pct): check('graduationPercentage', validate_percentage, 'Graduation Percentage')
        if clean_str(grad_cgpa): check('graduationCGPA', validate_cgpa_optional)

    # Skills (Required Categories)
    check('technical', validate_skills, 'Technical Skills')
    check('creative', validate_skills, 'Creative Skills')
    check('cognitive', validate_skills, 'Cognitive Skills')
    check('tools', validate_skills, 'Tools & Technologies')
    check('ethics', validate_skills, 'Ethics & Values')

    # Advertisements
    check('advertisements', validate_advertisements)

    # Core Documents
    check('profileImage', validate_file_reference, 'Profile Image')
    check('resume', validate_file_reference, 'Resume')
    check('identityProof', validate_file_reference, 'Identity Proof')
    
    # Qualifying Degree (Optional)
    if 'qualifyingDegree' in mapping and clean_str(get_cell(row, mapping, 'qualifyingDegree')):
        check('qualifyingDegree', validate_qualifying_degree)
        check('qualifyingSpecialization', validate_qualifying_specialization)
        if clean_str(get_cell(row, mapping, 'qualifyingPercentage')):
            check('qualifyingPercentage', validate_percentage, 'Qualifying Percentage')
        if clean_str(get_cell(row, mapping, 'qualifyingMarksheet')):
            check('qualifyingMarksheet', validate_file_reference, 'Qualifying Marksheet')

    # If there are ANY errors, return errors and original data
    if field_errors:
        return None, field_errors, original_data

    # --- BUILD VALID RECORD ---
    clean_mobile = re.sub(r'\D', '', clean_str(get_cell(row, mapping, 'mobile')))
    # Prepend +91 if not present (as per India default in Register.jsx)
    if len(clean_mobile) == 10:
        clean_mobile = '+91' + clean_mobile
    elif not clean_mobile.startswith('+'):
        # Just a fallback, but mobile validator usually ensures 10 digits for now
        pass

    record = {
        "fullName": clean_str(get_cell(row, mapping, 'fullName')),
        "fathersName": clean_str(get_cell(row, mapping, 'fathersName')),
        "email": clean_str(get_cell(row, mapping, 'email')).lower(),
        "mobile": clean_mobile,
        "gender": resolve_gender(get_cell(row, mapping, 'gender')),
        "dob": parse_dob(get_cell(row, mapping, 'dob')),
        "password": clean_str(get_cell(row, mapping, 'password')),
        "confirmPassword": clean_str(get_cell(row, mapping, 'password')), # Required for registration endpoint
        "permanentAddress": clean_str(get_cell(row, mapping, 'permanentAddress')),
        "state": clean_str(get_cell(row, mapping, 'state')),
        "isEmailVerified": True,
        "profileImage": clean_str(get_cell(row, mapping, 'profileImage')),
        "resumeUrl": clean_str(get_cell(row, mapping, 'resume')),
        "identityProofUrl": clean_str(get_cell(row, mapping, 'identityProof')),
        "advertisements": parse_advertisements(get_cell(row, mapping, 'advertisements')),
        "skillSets": {
            "technical": parse_skills(get_cell(row, mapping, 'technical')),
            "creative": parse_skills(get_cell(row, mapping, 'creative')),
            "cognitive": parse_skills(get_cell(row, mapping, 'cognitive')),
            "tools": parse_skills(get_cell(row, mapping, 'tools')),
            "ethics": parse_skills(get_cell(row, mapping, 'ethics'))
        },
        "education": {
            "tenth": {
                "board": clean_str(get_cell(row, mapping, 'tenthBoard')),
                "passingYear": safe_int(get_cell(row, mapping, 'tenthPassingYear')),
                "percentage": safe_float(get_cell(row, mapping, 'tenthPercentage')),
                "marksheetUrl": clean_str(get_cell(row, mapping, 'tenthMarksheet'))
            },
            "twelfth": {
                "board": clean_str(get_cell(row, mapping, 'twelfthBoard')),
                "passingYear": safe_int(get_cell(row, mapping, 'twelfthPassingYear')),
                "percentage": safe_float(get_cell(row, mapping, 'twelfthPercentage')),
                "marksheetUrl": clean_str(get_cell(row, mapping, 'twelfthMarksheet'))
            },
            "graduation": {
                "degree": clean_str(get_cell(row, mapping, 'graduationDegree')),
                "specialization": clean_str(get_cell(row, mapping, 'graduationSpecialization')),
                "passingYear": safe_int(get_cell(row, mapping, 'graduationPassingYear')),
                "cgpa": safe_float(get_cell(row, mapping, 'graduationCGPA')),
                "percentage": safe_float(get_cell(row, mapping, 'graduationPercentage')),
                "marksheetUrl": clean_str(get_cell(row, mapping, 'graduationMarksheet'))
            },
            "qualifyingDegree": {
                "degree": clean_str(get_cell(row, mapping, 'qualifyingDegree')),
                "specialization": clean_str(get_cell(row, mapping, 'qualifyingSpecialization')),
                "percentage": safe_float(get_cell(row, mapping, 'qualifyingPercentage')),
                "marksheetUrl": clean_str(get_cell(row, mapping, 'qualifyingMarksheet'))
            }
        },
        "row": row_number,
        "originalData": original_data
    }

    return record, {}, original_data

def process_file(file_path):
    if pd is None:
        return {"success": False, "message": "Pandas library not found. Please run 'pip install pandas openpyxl'"}
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        if df.empty:
            return {"success": False, "message": "Excel/CSV file is empty."}

        mapping = analyze_columns(df.columns)

        # Check critical columns exist
        missing_critical: List[str] = []
        critical_fields = [
            'fullName', 'email', 'mobile', 'password'
        ]
        for key in critical_fields:
            if key not in mapping:
                missing_critical.append(key)

        if missing_critical:
            return {
                "success": False,
                "message": f"Missing required columns in Excel file. Could not find mapping for: {', '.join(missing_critical)}. Found columns: {list(df.columns)}"
            }

        valid_records = []
        error_records = []

        for index, row in df.iterrows():
            if row.isna().all():
                continue

            row_num = index + 2
            record, field_errors, original_data = validate_and_build_record(row, mapping, row_num)

            if field_errors:
                error_records.append({
                    "row": row_num,
                    "name": clean_str(get_cell(row, mapping, 'fullName')) or f"Row {row_num}",
                    "email": clean_str(get_cell(row, mapping, 'email')) or "N/A",
                    "fieldErrors": field_errors,
                    "originalData": original_data
                })
            else:
                valid_records.append(record)

        return {
            "success": True,
            "validCount": len(valid_records),
            "errorCount": len(error_records),
            "validRecords": valid_records,
            "errors": error_records,
            "mapping": {k: str(v) for k, v in mapping.items()}
        }

    except Exception as e:
        return {"success": False, "message": f"Processor error: {str(e)}"}
