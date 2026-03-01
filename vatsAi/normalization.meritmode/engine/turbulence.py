# engine/turbulence.py

def compute_cti(values):
    """
    Column Turbulence Index
    """
    if len(values) < 2:
        return 1.0

    values = sorted(values)
    range_val = max(values) - min(values)

    if range_val == 0:
        return 0

    gap_energy_sum = 0
    for i in range(len(values) - 1):
        gap = abs(values[i+1] - values[i])
        gap_energy_sum += gap ** 2

    cti = gap_energy_sum / (range_val ** 2 * len(values))
    return cti