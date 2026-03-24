import json
import sys
import os
from typing import Any, List, Dict

# Ensure the script directory is in sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from smge import SMGE # type: ignore
from neural_core import NeuralCore # type: ignore

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input:
            return
        input_data = json.loads(raw_input)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"JSON Parse Error: {str(e)}"}))
        return

    # Use Any cast for classes to prevent "non-class" linter errors
    NeuralCoreClass: Any = NeuralCore
    SMGEClass: Any = SMGE

    # Initialize Neural Core
    nn = NeuralCoreClass()
    
    results = []
    
    # Process each candidate
    for candidate in input_data:
        m = candidate["marks"]
        marks_input = [m["10th"]/100.0, m["12th"]/100.0, m["Grad"]/100.0, m["PG"]/100.0]
        
        # 1. Calculate Geometric Forces
        forces = SMGEClass.calculate_forces(m["10th"], m["12th"], m["Grad"], m["PG"], m["Interview"])
        
        # 2. Neural Enhancement (Self-learning refinement)
        # Train NN on the current merit wave to recognize the 'stability' energy
        nn_error = nn.train_step(marks_input, forces["sfmc"])
        nn_boost, _ = nn.forward(marks_input)
        
        # Final SFMC with Neural Refinement (subtle evolution)
        final_sfmc = forces["sfmc"] * (0.95 + 0.1 * nn_boost)
        
        results.append({
            "userId": candidate["userId"],
            "sfmc": round(final_sfmc, 6),
            "forces": {
                "pef": round(forces["pef"], 6),
                "ssm": round(forces["ssm"], 6),
                "dre": round(forces["dre"], 6),
                "lcp": round(forces["lcp"], 6),
                "ids": round(forces["ids"], 6)
            },
            "imbalanceRatio": round(forces["r"], 6),
            "identityHash": SMGEClass.compute_identity_hash(candidate["userId"]),
            "dre_val": forces["dre"], # For tie-breaking
            "ssm_val": forces["ssm"],
            "pef_val": forces["pef"],
            "lcp_val": forces["lcp"]
        })

    # Tie-Breaking System (Supreme Order)
    # 1. SFMC Desc 2. DRE Desc 3. SSM Desc 4. PEF Desc 5. LCP Desc 6. R Asc 7. Hash Asc
    results.sort(key=lambda x: (
        -x["sfmc"], 
        -x["dre_val"], 
        -x["ssm_val"], 
        -x["pef_val"], 
        -x["lcp_val"], 
        x["imbalanceRatio"], 
        x["identityHash"]
    ))

    # Assign Ranks
    for i, res in enumerate(results):
        res["rank"] = i + 1

    print(json.dumps({
        "success": True,
        "results": results,
        "metrics": {
            "nn_status": "evolved",
            "engine": "SMGE-Neural-Dual-Drive"
        }
    }))

if __name__ == "__main__":
    main()
