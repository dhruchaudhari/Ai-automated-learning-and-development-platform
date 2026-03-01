# engine/zone_geometry.py

class ZoneGeometry:

    def __init__(self, min_val, max_val):
        self.min_val = min_val
        self.max_val = max_val
        self.range_val = max_val - min_val

        self.zone_width = self.range_val / 3

        self.lower_end = min_val + self.zone_width
        self.core_end = min_val + 2 * self.zone_width

        self.core_midpoint = min_val + 1.5 * self.zone_width