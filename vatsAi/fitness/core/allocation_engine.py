class AllocationEngine:

    def allocate(self, matrix, jobs):
        """
        Global greedy allocation with candidate exclusivity.
        Maximizes total fitness under:
            - Each job gets O_k candidates
            - Each candidate selected at most once
        """

        result = {jid: [] for jid in jobs}
        selected_candidates = set()

        # Flatten all (job, candidate, score)
        triples = []
        for jid, scores in matrix.items():
            for cid, score in scores.items():
                triples.append((jid, cid, score))

        # Sort globally descending
        triples.sort(key=lambda x: x[2], reverse=True)

        for jid, cid, score in triples:
            if cid in selected_candidates:
                continue

            if len(result[jid]) < jobs[jid]["O"]:
                result[jid].append(cid)
                selected_candidates.add(cid)

        return result