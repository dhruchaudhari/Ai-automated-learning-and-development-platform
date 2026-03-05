import random

class EvolutionaryAllocator:

    def evolve(self, matrix, openings, generations=50):
        population = []

        job_id = list(matrix.keys())[0]
        candidates = list(matrix[job_id].keys())

        for _ in range(30):
            sample = random.sample(candidates, openings)
            population.append(sample)

        for _ in range(generations):
            scored = [(self.score(matrix, job_id, p), p)
                      for p in population]

            scored.sort(reverse=True)
            survivors = [p for _, p in scored[:10]]

            population = survivors.copy()

            while len(population) < 30:
                parent = random.choice(survivors)
                child = parent.copy()
                idx = random.randint(0, openings-1)
                child[idx] = random.choice(candidates)
                population.append(child)

        best = max(population,
                   key=lambda p: self.score(matrix, job_id, p))
        return best

    def score(self, matrix, job_id, selection):
        return sum(matrix[job_id][cid] for cid in selection)