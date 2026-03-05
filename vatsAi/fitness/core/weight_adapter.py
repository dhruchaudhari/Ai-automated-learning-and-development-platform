from config import LEARNING_RATE

class WeightAdapter:

    def update(self, beta, components, predicted, real):
        """
        components = [CSF, SEA, DCI, EGC, IM]
        """

        error = real - predicted

        new_beta = []

        for i in range(len(beta)):
            gradient = error * components[i]
            new_weight = beta[i] + LEARNING_RATE * gradient
            new_beta.append(max(new_weight, 0))

        # renormalize to sum = 1
        total = sum(new_beta) + 1e-9
        new_beta = [b / total for b in new_beta]

        return new_beta