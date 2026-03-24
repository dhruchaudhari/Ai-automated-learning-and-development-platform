import numpy as np

class Normalizer:

    def normalize_academics(self, candidates):

        # Collect all academics
        all_A = np.array([c["A"] for c in candidates.values()])

        mins = all_A.min(axis=0)
        maxs = all_A.max(axis=0)

        for c in candidates.values():
            vec = np.array(c["A"])
            norm = (vec - mins) / (maxs - mins + 1e-9)
            c["A"] = norm.tolist()

            c["P"] = c["P"] / 100  # interview normalization

        return candidates