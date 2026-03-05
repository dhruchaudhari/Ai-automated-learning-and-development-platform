class TensorBuilder:

    def candidate_tensor(self, raw):
        return {
            "A": raw["academics"],   # [10th,12th,grad,pg]
            "E": raw["experience"],
            "S": raw["skills"],      # dict
            "D": raw["degree_id"],
            "P": raw["interview"]
        }

    def job_tensor(self, raw):
        return {
            "R": raw["required_skills"],
            "W": raw["skill_weights"],
            "C": raw["criteria"],
            "O": raw["openings"],
            "P": raw["preferred_skills"],
            "degree_required": raw["degree_required"],
            "degree_specializations": raw["degree_specializations"]
        }