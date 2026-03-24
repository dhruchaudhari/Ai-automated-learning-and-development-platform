from config import DEFAULT_MIN_THRESHOLD

class AllocationEngine:

    def calculate_dynamic_threshold(self, matrix):
        """
        Learns the 'Quality Bar' based on the candidate pool.
        Targets top 25% of performers but never drops below a safe floor.
        For small pools (< 5), we stick to the baseline floor to ensure vacancies can be filled.
        """
        all_scores = [s for jid in matrix for s in matrix[jid].values()]
        if not all_scores:
            return DEFAULT_MIN_THRESHOLD
        
        # For small candidate pools, don't raise the bar aggressively based on one top performer.
        # This ensures qualified candidates aren't outcompeted by thresholds alone when seats are open.
        if len(all_scores) < 5:
            return DEFAULT_MIN_THRESHOLD

        all_scores.sort(reverse=True)
        
        # Take the score at the 25th percentile
        idx = max(0, int(len(all_scores) * 0.25) - 1)
        pool_top_tier = all_scores[idx]
        
        # Threshold is max of floor and (Pool Top Tier - margin)
        dynamic_bar = max(DEFAULT_MIN_THRESHOLD, pool_top_tier - 0.05)
        
        return round(min(dynamic_bar, 0.95), 4)

    def allocate(self, matrix, jobs):
        """
        Global greedy allocation with candidate exclusivity and dynamic thresholding.
        """
        threshold = self.calculate_dynamic_threshold(matrix)
        result = {jid: [] for jid in jobs}
        selected = set()
        triples = []
        
        disqualified = set() 
        outcompeted = set()  
        
        for jid, scores in matrix.items():
            for cid, score in scores.items():
                if score < threshold:
                    disqualified.add(cid)
                    continue
                triples.append((jid, cid, score))
                
        triples.sort(key=lambda x: x[2], reverse=True)
        
        for jid, cid, score in triples:
            if cid in selected:
                continue
                
            if len(result[jid]) < jobs[jid]["O"]:
                result[jid].append({"candidateId": cid, "fitnessScore": round(score, 6)})
                selected.add(cid)
            else:
                outcompeted.add(cid)
                    
        stats = {
            "disqualifiedCount": len(disqualified - selected),
            "outcompetedCount": len(outcompeted - selected),
            "dynamicThreshold": threshold
        }

        return result, stats