"""
Fitness & Allocation Engine – stdin/stdout bridge.
Modularized implementation using vatsAi/fitness/core components.
"""

import sys
import json
import traceback
import os

# Add current directory to path for core imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.job_field import JobField
from core.cross_fitness import CrossFitness
from core.allocation_engine import AllocationEngine
from core.evolutionary_allocator import EvolutionaryAllocator
from graph.scarcity_detector import ScarcityDetector
from graph.graph_builder import GraphBuilder
from graph.centrality import Centrality

def compute_analytics(matrix, allocation, candidates, jobs, qual_stats, scarcity, centrality):
    all_scores = [s for jscores in matrix.values() for s in jscores.values()]
    avg = sum(all_scores) / max(len(all_scores), 1)
    max_s = max(all_scores) if all_scores else 0
    min_s = min(all_scores) if all_scores else 0

    total_allocated = sum(len(v) for v in allocation.values())
    total_candidates = len(candidates)
    total_openings = sum(j["O"] for j in jobs.values())

    return {
        "totalCandidates": total_candidates,
        "totalJobs": len(jobs),
        "totalOpenings": total_openings,
        "totalAllocated": total_allocated,
        "unallocatedCount": total_candidates - total_allocated,
        "disqualifiedCount": qual_stats.get("disqualifiedCount", 0),
        "outcompetedCount": qual_stats.get("outcompetedCount", 0),
        "dynamicThreshold": qual_stats.get("dynamicThreshold", 0.75),
        "averageFitness": round(avg, 4),
        "maxFitness": round(max_s, 4),
        "minFitness": round(min_s, 4),
        "fillRate": round(total_allocated / max(total_openings, 1) * 100, 2),
        "skillScarcity": scarcity,
        "candidateCentrality": centrality
    }

def main():
    try:
        raw = sys.stdin.read()
        if not raw:
            return
            
        data = json.loads(raw)
        candidates = data["candidates"]
        jobs = data["jobs"]

        # 1. Initialize Core Engines
        job_field = JobField()
        cross_fitness = CrossFitness()
        allocation_engine = AllocationEngine()
        scarcity_detector = ScarcityDetector()
        graph_builder = GraphBuilder()
        centrality_engine = Centrality()
        evolutionary_allocator = EvolutionaryAllocator()

        # 2. Compute Fitness Matrix & Detailed Breakdowns
        matrix, details = cross_fitness.compute_matrix(candidates, jobs, job_field)

        # 3. Protocol Allocation (Greedy)
        allocation, qual_stats = allocation_engine.allocate(matrix, jobs)

        # 4. Refined Allocation (Evolutionary - for single job scenarios)
        if len(jobs) == 1:
            jid = list(jobs.keys())[0]
            openings = jobs[jid]["O"]
            if len(candidates) >= openings:
                best_selection = evolutionary_allocator.evolve(matrix, openings)
                # We could potentially swap or flag 'best_selection' vs greedy allocation here
                # For now, we'll keep the greedy allocation as primary but compute this as 'advanced_pick'
                qual_stats["evolutionaryPick"] = best_selection

        # 5. Graph Analysis
        graph = graph_builder.build(candidates, jobs)
        centrality = centrality_engine.compute(graph)
        scarcity = scarcity_detector.detect(candidates)

        # 6. Generate Analytics
        analytics = compute_analytics(matrix, allocation, candidates, jobs, qual_stats, scarcity, centrality)

        # 7. Aggregate Per-Candidate Analysis
        candidate_results = {}
        for cid in candidates:
            candidate_results[cid] = {"name": candidates[cid].get("name", "Unknown"), "jobs": {}}
            for jid in jobs:
                candidate_results[cid]["jobs"][jid] = details[jid][cid]

        output = {
            "success": True,
            "fitnessMatrix": matrix,
            "candidateBreakdowns": candidate_results,
            "allocation": allocation,
            "analytics": analytics,
            "graph": graph,
            "engineVersion": "2.2.0-modular-advanced-cognitive"
        }

        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }))

if __name__ == "__main__":
    main()
