# core/job_field.py

import math
from config import BETA, LAMBDA_EXP, PREFERRED_SKILL_BOOST
from utils.math_utils import sigmoid, diminishing_growth


class JobField:

    # ----------------------------
    # FIXED CRITERIA SATISFACTION
    # ----------------------------
    def criteria_satisfaction(self, candidate, criteria):

        if not criteria:
            return 1

        values = []

        for c in criteria:
            # Field map for academic tensors if needed
            field_val = 0
            if c["field"] in candidate:
                field_val = candidate[c["field"]]
            elif "A" in candidate:
                field_map = {"10th": 0, "12th": 1, "grad": 2, "pg": 3}
                idx = field_map.get(c["field"])
                if idx is not None and idx < len(candidate["A"]):
                    field_val = candidate["A"][idx]
            
            diff = field_val - c["min"]
            values.append(sigmoid(diff))

        # geometric mean (stable)
        log_sum = sum(math.log(v + 1e-9) for v in values)
        return math.exp(log_sum / len(values))


    # ----------------------------
    # SKILL ALIGNMENT (Normalized)
    # ----------------------------
    def skill_alignment(self, candidate, job):

        total_weight = sum(job["W"].values()) + 1e-9
        total = 0

        for skill, weight in job["W"].items():
            cand_level = candidate.get("S", {}).get(skill, 0)
            required = max(job.get("R", {}).get(skill, 1), 1e-9)

            comp = min(cand_level / required, 1)

            if skill in job.get("P", []):
                comp *= PREFERRED_SKILL_BOOST

            comp = min(comp, 1)

            total += weight * comp

        return total / total_weight


    # ----------------------------
    # SFMC INDEX (Foundation Match)
    # ----------------------------
    def sfmc_index(self, candidate, job):
        # SFMC score is passed as 'F' from backend (Foundation Score)
        return candidate.get("F", 0)


    # ----------------------------
    # FINAL FITNESS FUNCTION
    # ----------------------------
    def fitness(self, candidate, job):

        CSF = self.criteria_satisfaction(candidate, job.get("C", []))
        SEA = self.skill_alignment(candidate, job)
        SFMC = self.sfmc_index(candidate, job)
        EGC = diminishing_growth(candidate.get("E", 0), LAMBDA_EXP)
        IM = candidate.get("P", 0)

        score = (
            BETA[0] * CSF +
            BETA[1] * SEA +
            BETA[2] * SFMC +
            BETA[3] * EGC +
            BETA[4] * IM
        )

        return {
            "score": round(min(max(score, 0), 1), 6),
            "components": {
                "CSF": round(CSF, 6),
                "SEA": round(SEA, 6),
                "SFMC": round(SFMC, 6),
                "EGC": round(EGC, 6),
                "IM": round(IM, 6)
            },
            "weights": {
                "CSF": BETA[0],
                "SEA": BETA[1],
                "SFMC": BETA[2],
                "EGC": BETA[3],
                "IM": BETA[4]
            }
        }