class CrossFitness:

    def compute_matrix(self, candidates, jobs, job_field):
        matrix = {}
        details = {}

        for jid, job in jobs.items():
            matrix[jid] = {}
            details[jid] = {}
            for cid, cand in candidates.items():
                res = job_field.fitness(cand, job)
                matrix[jid][cid] = res["score"]
                details[jid][cid] = res

        return matrix, details