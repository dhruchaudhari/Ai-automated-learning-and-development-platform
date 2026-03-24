import sys
import json
import os
import re

# Add the parent directory (vatsAi/fitness) to sys.path to allow imports from core/
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(current_dir, '..'))

from core.weight_adapter import WeightAdapter
import config

def update_config_file(new_beta):
    """
    Safely updates the BETA variable in config.py
    """
    # config.py is in the parent directory of this script
    current_script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(current_script_dir, '..', 'config.py')
    
    with open(config_path, 'r') as f:
        content = f.read()
    
    # Use regex to find and replace the BETA list
    beta_str = f"BETA = [{', '.join([f'{b:.4f}' for b in new_beta])}]"
    new_content = re.sub(r'BETA\s*=\s*\[.*?\]', beta_str, content)
    
    with open(config_path, 'w') as f:
        f.write(new_content)

def main():
    try:
        # Expected input: list of { "components": [CSF, SEA, SFMC, EGC, IM], "score": predicted_score, "hired": bool }
        raw = sys.stdin.read()
        if not raw.strip():
            print(json.dumps({"success": False, "error": "No training data provided"}))
            return
            
        training_data = json.loads(raw)
        if not training_data:
             print(json.dumps({"success": True, "message": "No data to learn from", "weights": config.BETA}))
             return

        adapter = WeightAdapter()
        current_beta = config.BETA
        
        # Accumulate updates
        accumulated_beta = [0.0] * len(current_beta)
        count = 0
        
        for record in training_data:
            components = [
                record["components"].get("CSF", 0),
                record["components"].get("SEA", 0),
                record["components"].get("SFMC", 0),
                record["components"].get("EGC", 0),
                record["components"].get("IM", 0)
            ]
            predicted = record.get("score", 0.5)
            # If hired, target is 1.0. If not hired but was a candidate, target could be lower?
            # For now, let's learn from positive reinforcements only to strengthen the "hiring profile"
            if record.get("hired", False):
                target = 1.0
                updated_beta = adapter.update(current_beta, components, predicted, target)
                for i in range(len(current_beta)):
                    accumulated_beta[i] += updated_beta[i]
                count += 1
        
        if count > 0:
            final_beta = [b / count for b in accumulated_beta]
            # Renormalize
            total = sum(final_beta) + 1e-9
            final_beta = [b / total for b in final_beta]
            
            update_config_file(final_beta)
            print(json.dumps({
                "success": True, 
                "message": f"Successfully learned from {count} records", 
                "old_weights": current_beta,
                "new_weights": final_beta
            }))
        else:
            print(json.dumps({"success": True, "message": "No positive samples to learn from", "weights": current_beta}))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
