from datetime import datetime

CURRENT_YEAR = datetime.now().year

# ========================= COLUMN MAPPING =========================
# AI-powered flexible column name resolution
COLUMN_MAPPINGS = {
    'fullName': ['fullname', 'name', 'studentname', 'candidate', 'candidatename', 'full name', 'student name', 'candidate name'],
    'fathersName': ['fathersname', 'fathername', 'father', 'guardian', 'father name', 'guardian name', "father's name", "fathers name"],
    'email': ['email', 'emailid', 'mail', 'email address', 'email id', 'e-mail'],
    'mobile': ['mobile', 'phone', 'contact', 'mobilenumber', 'phonenumber', 'contactnumber', 'mobile number', 'phone number', 'contact number', 'telephone'],
    'gender': ['gender', 'sex'],
    'dob': ['dob', 'dateofbirth', 'birthdate', 'date of birth', 'birth date'],
    'permanentAddress': ['address', 'permanentaddress', 'permanent address', 'residential address', 'residence'],
    'state': ['state', 'region', 'province'],
    'password': ['password', 'pwd', 'pass'],

    'tenthBoard': ['10thboard', 'tenthboard', 'board10', '10th board', 'matric board', 'sslc board'],
    'tenthPassingYear': ['10thyear', 'tenthyear', '10thpassingyear', '10th passing year', '10th year'],
    'tenthPercentage': ['10thpercentage', 'tenthpercentage', '10th%', '10th percentage', '10th %', '10th marks'],

    'twelfthBoard': ['12thboard', 'twelfthboard', 'board12', '12th board', 'hsc board', 'intermediate board'],
    'twelfthPassingYear': ['12thyear', 'twelfthyear', '12thpassingyear', '12th passing year', '12th year'],
    'twelfthPercentage': ['12thpercentage', 'twelfthpercentage', '12th%', '12th percentage', '12th %', '12th marks'],

    'graduationDegree': ['graddegree', 'graduationdegree', 'bachelors', 'degree', 'graduation degree', 'bachelor degree'],
    'graduationSpecialization': ['gradspecialization', 'gradstream', 'graduation specialization', 'bachelors specialization', 'degree specialization'],
    'graduationPassingYear': ['gradyear', 'graduationyear', 'graduation passing year', 'grad year'],
    'graduationCGPA': ['gradcgpa', 'graduationcgpa', 'cgpa', 'graduation cgpa', 'grad cgpa'],
    'graduationPercentage': ['gradpercentage', 'graduationpercentage', 'grad%', 'graduation percentage', 'grad %', 'graduation marks'],

    'qualifyingDegree': ['pgdegree', 'masters', 'qualifyingdegree', 'pg degree', 'master degree', 'post graduation'],
    'qualifyingSpecialization': ['pgspecialization', 'pgstream', 'qualifying specialization', 'masters specialization', 'pg specialization'],
    'qualifyingPercentage': ['pgpercentage', 'qualifyingpercentage', 'pg%', 'pg percentage', 'pg %', 'masters marks'],
    'qualifyingMarksheet': ['pgmarksheet', 'qualifyingmarksheet', 'pg marksheet', 'qualifying marksheet'],

    # --- SKILLS & EXPERTISE ---
    'technical': ['technicalskills', 'technical', 'techskills', 'technical skills', 'skills_technical'],
    'creative': ['creativeskills', 'creative', 'creatvskills', 'creative skills', 'skills_creative'],
    'cognitive': ['cognitiveskills', 'cognitive', 'cognitiveskills', 'cognitive skills', 'skills_cognitive'],
    'tools': ['toolsskills', 'tools', 'technologies', 'tools & technologies', 'skills_tools'],
    'ethics': ['ethicsskills', 'ethics', 'values', 'ethics & values', 'skills_ethics'],

    # --- DOCUMENTS & OTHER ---
    'profileImage': ['photo', 'profileimage', 'profilepic', 'profile photo', 'profile image'],
    'resume': ['resume', 'cv', 'resumeurl', 'cvurl', 'resume link', 'cv link'],
    'identityProof': ['identityproof', 'idproof', 'aadhaar', 'id card', 'identity proof'],
    'tenthMarksheet': ['10thmarksheet', 'tenthmarksheet', '10th marksheet', '10th marksheet'],
    'twelfthMarksheet': ['12thmarksheet', 'twelfthmarksheet', '12th marksheet', '12th marksheet'],
    'graduationMarksheet': ['gradmarksheet', 'graduationmarksheet', 'graduation marksheet', 'grad marksheet'],
    'advertisements': ['advertisements', 'ads', 'applied_for', 'job_ads', 'advertisement names']
}
