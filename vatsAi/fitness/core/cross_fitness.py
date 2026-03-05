class CrossFitness:

    def compute_matrix(self, candidates, jobs, job_field):
        matrix = {}

        for jid, job in jobs.items():
            matrix[jid] = {}
            for cid, cand in candidates.items():
                score = job_field.fitness(cand, job)
                matrix[jid][cid] = score

        return matrix