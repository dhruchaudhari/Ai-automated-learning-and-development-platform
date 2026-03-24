import math

class SMGE:
    """
    Supreme Merit Geometric Engine (SMGE)
    Implements the 5 original forces and the Final Merit Core.
    """
    @staticmethod
    def calculate_forces(a, b, c, d, i):
        # 1. Progressive Elevation Force (PEF)
        g1 = (b - a) / 100.0
        g2 = (c - b) / 100.0
        g3 = (d - c) / 100.0
        pef = (g1**3 + g2**3 + g3**3)

        # 2. Structural Stability Mass (SSM)
        f = abs(a - b) + abs(b - c) + abs(c - d)
        ssm = math.exp(-f / 150.0)

        # 3. Depth Reinforcement Energy (DRE)
        weights = [1.0, 1.2, 1.5, 1.8]
        dre_num = (a * weights[0]) + (b * weights[1]) + (c * weights[2]) + (d * weights[3])
        dre_den = sum(weights) * 100.0
        dre = dre_num / dre_den

        # 4. Live Cognitive Projection (LCP)
        lcp = (i**2) / (i**2 + 2500.0) if (i**2 + 2500.0) != 0 else 0

        # 5. Integrity Dampening Shield (IDS)
        marks = [a, b, c, d]
        r = (max(marks) - min(marks)) / 100.0
        ids = 1 - (r ** 1.5)

        # Supreme Final Merit Core (SFMC)
        sfmc = (dre * ssm * ids) + (0.45 * pef) + (0.35 * lcp)
        
        return {
            "sfmc": sfmc,
            "pef": pef,
            "ssm": ssm,
            "dre": dre,
            "lcp": lcp,
            "ids": ids,
            "r": r
        }

    @staticmethod
    def compute_identity_hash(user_id):
        # Deterministic Identity Hash (ASCII sum of ID string)
        return sum(ord(char) for char in str(user_id))
