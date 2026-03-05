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
            diff = candidate[c["field"]] - c["min"]
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
            cand_level = candidate["S"].get(skill, 0)
            required = max(job["R"].get(skill, 1), 1e-9)

            comp = min(cand_level / required, 1)

            if skill in job["P"]:
                comp *= PREFERRED_SKILL_BOOST

            comp = min(comp, 1)

            total += weight * comp

        return total / total_weight


    # ----------------------------
    # DEGREE MATCH
    # ----------------------------
    def degree_index(self, candidate, job):

        if candidate["D"] == job["degree_required"]:
            return 1

        if candidate["D"] in job["degree_specializations"]:
            return 0.6

        return 0


    # ----------------------------
    # FINAL FITNESS FUNCTION
    # ----------------------------
    def fitness(self, candidate, job):

        CSF = self.criteria_satisfaction(candidate, job["C"])
        SEA = self.skill_alignment(candidate, job)
        DCI = self.degree_index(candidate, job)
        EGC = diminishing_growth(candidate["E"], LAMBDA_EXP)
        IM = candidate["P"]

        score = (
            BETA[0] * CSF +
            BETA[1] * SEA +
            BETA[2] * DCI +
            BETA[3] * EGC +
            BETA[4] * IM
        )

        return min(max(score, 0), 1)