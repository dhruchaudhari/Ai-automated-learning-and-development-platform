class DataLoader:

    def __init__(self, db):
        self.db = db

    def load_candidates(self):
        return self.db.get_candidates()

    def load_jobs(self):
        return self.db.get_jobs()