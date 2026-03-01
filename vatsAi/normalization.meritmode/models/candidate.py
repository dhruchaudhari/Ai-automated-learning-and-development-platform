# models/candidate.py

class Candidate:
    def __init__(self, name, marks):
        """
        marks = {
            "10th": value or None,
            "12th": value or None,
            "Grad": value or None,
            "PG": value or None
        }
        """
        self.name = name
        self.marks = marks

    def get_existing_marks(self):
        valid = []
        for v in self.marks.values():
            if v is not None:
                try:
                    valid.append(float(v))
                except (ValueError, TypeError):
                    continue
        return valid

    def compute_css(self):
        existing = self.get_existing_marks()
        if not existing:
            return 0
        return sum(existing) / len(existing)

    def to_dict(self):
        return {"Candidate": self.name, **self.marks}