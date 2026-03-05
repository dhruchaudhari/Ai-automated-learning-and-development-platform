class ScarcityDetector:

    def detect(self, candidates):
        skill_count = {}

        for cand in candidates.values():
            for s in cand["S"]:
                skill_count[s] = skill_count.get(s, 0) + 1

        scarcity = {}
        total = len(candidates)

        for skill, count in skill_count.items():
            scarcity[skill] = 1 - (count / total)

        return scarcity