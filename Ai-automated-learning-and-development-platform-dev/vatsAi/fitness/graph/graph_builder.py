class GraphBuilder:

    def build(self, candidates, jobs):
        graph = {"nodes": {}, "edges": []}

        for cid, cand in candidates.items():
            graph["nodes"][cid] = "candidate"

            for skill in cand["S"]:
                graph["edges"].append((cid, skill, "hasSkill"))

        for jid, job in jobs.items():
            graph["nodes"][jid] = "job"

            for skill in job["R"]:
                graph["edges"].append((jid, skill, "requires"))

        return graph