from core.job_field import JobField
from core.cross_fitness import CrossFitness
from core.allocation_engine import AllocationEngine

def run(candidates, jobs):

    job_field = JobField()
    cross = CrossFitness()

    matrix = cross.compute_matrix(candidates, jobs, job_field)

    allocator = AllocationEngine()
    result = allocator.allocate(matrix, jobs)

    return result