from core.weight_adapter import WeightAdapter
from config import BETA

class AdaptiveUpdate:

    def apply(self, predicted, actual):
        adapter = WeightAdapter()
        return adapter.update(BETA, predicted, actual)