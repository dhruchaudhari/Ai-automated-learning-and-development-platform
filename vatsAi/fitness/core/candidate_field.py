import numpy as np
from config import ALPHA
from utils.math_utils import safe_divide

class CandidateField:

    def academic_dominance(self, Ai, Aj):
        return np.sum(np.abs(np.array(Ai) - np.array(Aj)))

    def skill_similarity(self, Si, Sj, weights):
        numerator = 0
        denominator = 0

        for skill in weights:
            wi = weights[skill]
            si = Si.get(skill, 0)
            sj = Sj.get(skill, 0)

            numerator += wi * min(si, sj)
            denominator += wi * max(si, sj)

        return safe_divide(numerator, denominator)

    def fitness(self, Ci, Cj, weights):
        ADF = self.academic_dominance(Ci["A"], Cj["A"])
        SST = self.skill_similarity(Ci["S"], Cj["S"], weights)
        EXP = abs(Ci["E"] - Cj["E"])

        norm_adf = 1 / (1 + ADF)

        return (
            ALPHA[0] * norm_adf +
            ALPHA[1] * SST -
            ALPHA[2] * EXP
        )