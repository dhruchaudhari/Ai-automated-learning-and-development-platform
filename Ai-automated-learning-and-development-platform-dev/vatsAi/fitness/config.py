# --- VatsAi Fitness Configuration ---

# ALPHA: Candidate-Candidate Similarity Weights
# [Self-Similarity, Peer-Comparison, Cross-Merit Alignment]
ALPHA = [0.3, 0.4, 0.3]              

# BETA: Candidate-Job Fitness Weights (The Core Ranking Engine)
# [CSF, SEA, SFMC, EGC, IM]
# 0: CSF - Criteria Satisfaction Factor (Age, Min-GPA, etc.)
# 1: SEA - Skill Expertise Alignment (Technical Prowess)
# 2: SFMC - Standard Foundation Merit Criteria (Education/Merit Match)
# 3: EGC - Experience Growth Coefficient (Tenure/Seniority)
# 4: IM  - Interview / Exam Merit (Performance Score)
BETA = [0.1976, 0.3170, 0.1168, 0.1255, 0.2431]  

# LAMBDA_EXP: Decay constant for exponential experience growth diminishing returns
LAMBDA_EXP = 0.35

# LEARNING_RATE: Speed at which the AI adapts BETA weights during self-training
LEARNING_RATE = 0.02

# PREFERRED_SKILL_BOOST: Multiplier applied when a candidate possesses a 'Preferred' (non-required) skill
PREFERRED_SKILL_BOOST = 1.12

# EPSILON: Small constant for numerical stability (avoids division by zero)
EPSILON = 1e-9

# DEFAULT_MIN_THRESHOLD: The baseline 'Quality Gate'. 
# Candidates must score above this to be considered 'Qualified'.
# The AI adjusts this dynamically based on pool quality, using this as the floor.
DEFAULT_MIN_THRESHOLD = 0.60