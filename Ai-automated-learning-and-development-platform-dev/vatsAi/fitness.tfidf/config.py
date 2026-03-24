"""
fitness.tfidf – Configuration & Hyperparameters
Self-learning TF-IDF + Neural Re-Ranker fitness engine.
"""

# ─── TF-IDF Vectorizer Settings ───
TFIDF_MAX_FEATURES = 5000
TFIDF_NGRAM_RANGE = (1, 3)
TFIDF_SUBLINEAR_TF = True
TFIDF_MIN_DF = 1
TFIDF_MAX_DF = 0.95

# ─── Neural Re-Ranker Architecture ───
# Input: [tfidf_cosine, skill_overlap, experience_match, education_match, project_relevance, certifications_match]
NEURAL_INPUT_DIM = 6
NEURAL_HIDDEN_DIM = 16
NEURAL_OUTPUT_DIM = 1
NEURAL_LEARNING_RATE = 0.01
NEURAL_SELF_TRAIN_EPOCHS = 50

# ─── Supreme 7.2 Feature Weights ───
# Strictly AI-based metrics only
# Order: [skillOverlap, educationMatch]
INITIAL_FEATURE_WEIGHTS = [0.50, 0.50]

# ─── Experience Matching ───
LAMBDA_EXP = 0.15           # Diminishing-returns decay for experience
MAX_EXP_YEARS = 30          # Cap for experience normalization

# ─── Score Thresholds ───
HIGH_FITNESS = 0.70
MEDIUM_FITNESS = 0.40

# ─── Section Detection Patterns ───
# Regex patterns used by ResumeAnalyzer to find headings in arbitrary resume formats
SECTION_PATTERNS = {
    "skills": [
        r"(?i)\b(technical\s+)?skills?\b",
        r"(?i)\bcore\s+competenc(ies|e)\b",
        r"(?i)\btechnolog(ies|y)\b",
        r"(?i)\btools?\s*(and|&)\s*tech",
        r"(?i)\bproficienc(ies|y)\b",
        r"(?i)\bexpertise\b",
    ],
    "experience": [
        r"(?i)\b(work|professional)\s+experience\b",
        r"(?i)\bemployment\s+history\b",
        r"(?i)\bcareer\s+summary\b",
        r"(?i)\bwork\s+history\b",
        r"(?i)\bexperience\b",
    ],
    "projects": [
        r"(?i)\bprojects?\b",
        r"(?i)\bkey\s+projects?\b",
        r"(?i)\bacademic\s+projects?\b",
        r"(?i)\bpersonal\s+projects?\b",
    ],
    "education": [
        r"(?i)\beducation(al)?\s*(background|qualifications?)?\b",
        r"(?i)\bacademic\s+(background|qualifications?)\b",
        r"(?i)\bqualifications?\b",
    ],
    "certifications": [
        r"(?i)\bcertificat(ions?|es?)\b",
        r"(?i)\blicens(es?|ures?)\b",
        r"(?i)\btraining\b",
        r"(?i)\bcourses?\b",
    ],
    "summary": [
        r"(?i)\b(professional\s+)?summary\b",
        r"(?i)\bobjective\b",
        r"(?i)\bprofile\b",
        r"(?i)\babout\s+me\b",
    ],
}

# ─── Dynamic NLP Experience Patterns ───
# Match formats like: "Jan 2018 - Present", "03/2015 to 05/2020", "2018 – 2021", "Aug 2010 - Dec 2012"
DATE_RANGE_PATTERNS = [
    r"(?i)(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)?[a-z]*[\s\.,\/]*((?:19|20)\d{2})\s*(?:-|–|to)\s*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)?[a-z]*[\s\.,\/]*((?:19|20)\d{2}|present|current)",
    r"((?:19|20)\d{2})\s*(?:-|–|to)\s*((?:19|20)\d{2}|present|current)",
    r"((?:0[1-9]|1[0-2])[\/\.-]?(?:19|20)\d{2})\s*(?:-|–|to)\s*((?:0[1-9]|1[0-2])[\/\.-]?(?:19|20)\d{2}|present|current)"
]

# ─── Noise Reduction & AI Refinement ───
# Common noise words in resumes that are NOT skills
TECH_BLACKLIST = {
    "among", "bless", "ceo", "code", "companies", "actively", "anand", "borsad", "gujarat",
    "india", "school", "university", "college", "institute", "successfully", "built",
    "added", "achievements", "centered", "mindset", "empathy", "driven", "time",
    "management", "collaborate", "collaboration", "communication", "centered",
    "disciple", "purpose", "innovation", "ethics", "leadership", "values", "data",
    "research", "desired", "client", "enhance", "found", "founded", "initiative",
    "science", "project", "education", "experience", "work", "summary", "profile",
    "contact", "phone", "email", "address", "location", "github", "linkedin",
    "portfolio", "about", "me", "hsc", "ssc", "cbse", "icse", "percentage", "marks",
}

# Key words to validate certifications
CERT_KEYWORDS = [
    "certified", "certification", "certificate", "diploma", "license", "licensure",
    "udemy", "coursera", "edx", "nptel", "aws", "google", "microsoft", "azure",
    "ibm", "cisco", "oracle", "pmp", "scrum", "agile", "degree", "internship",
]

# High-value tech skills to prioritize (Supreme Deep AI)
COMMON_TECH_WHITELIST = {
    "python", "javascript", "java", "c++", "c#", "react", "angular", "vue", "node.js",
    "express", "mongodb", "mysql", "postgresql", "sql", "aws", "azure", "gcp",
    "docker", "kubernetes", "git", "jenkins", "ci/cd", "machine learning", "ai",
    "deep learning", "nlp", "tensorflow", "pytorch", "scikit-learn", "pandas",
    "numpy", "flask", "django", "fastapi", "rest api", "graphql", "redux",
    "typescript", "swift", "kotlin", "flutter", "dart", "spring boot", "php",
    "laravel", "ruby", "rails", "golang", "rust", "linux", "aws lambda", "s3", "ec2",
}

# ─── Domain Awareness & Semantic Mapping ───
# Maps certifications/skills to broad domains for cross-validation
DOMAIN_MAPPINGS = {
    "cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "s3", "ec2", "lambda"],
    "ml_ai": ["python", "tensorflow", "pytorch", "scikit-learn", "numpy", "pandas", "nlp", "deep learning", "nlp"],
    "backend": ["node.js", "express", "django", "flask", "fastapi", "spring boot", "golang", "postgresql", "mysql", "mongodb"],
    "frontend": ["react", "angular", "vue", "javascript", "typescript", "html", "css", "tailwind", "redux"],
    "management": ["pmp", "scrum", "agile", "project management", "jira", "asana"],
}

# Significance Multipliers for XAI
SIGNIFICANCE_WEIGHTS = {
    "primary_project": 1.2,   # Found in projects
    "primary_exp": 1.1,       # Found in experience
    "list_only": 0.6,         # Only in skills list
}

# ─── Supreme Deep AI 7.1: Hybrid Mode (Local + Gemini) ───
GEMINI_API_KEY = "AIzaSyCLczd_uuM9x3PnkYpsNKbn20rcAx2XC_8"
USE_GEMINI = True

ENGINE_VERSION = "7.1.0-supreme-hybrid"
