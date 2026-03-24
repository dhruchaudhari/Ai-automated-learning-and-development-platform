import json
import sys
import os
from typing import List, Dict, Any, Optional, Tuple, cast

# Ensure the AI engine root and project root are in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Import AI components with type ignores for the linter
try:
    from models.candidate import Candidate # type: ignore
    from engine.column_analyzer import ColumnAnalyzer # type: ignore
    from engine.weight_engine import WeightEngine # type: ignore
    from engine.zone_geometry import ZoneGeometry # type: ignore
    from engine.imputer import Imputer # type: ignore
except ImportError:
    # type: ignore fallback for IDE resolution
    from models.candidate import Candidate as Candidate # type: ignore
    from engine.column_analyzer import ColumnAnalyzer as ColumnAnalyzer # type: ignore
    from engine.weight_engine import WeightEngine as WeightEngine # type: ignore
    from engine.zone_geometry import ZoneGeometry as ZoneGeometry # type: ignore
    from engine.imputer import Imputer as Imputer # type: ignore
    # type: ignore fallback for submodule imports
    from .models.candidate import Candidate as Candidate # type: ignore
    from .engine.column_analyzer import ColumnAnalyzer as ColumnAnalyzer # type: ignore
    from .engine.weight_engine import WeightEngine as WeightEngine # type: ignore
    from .engine.zone_geometry import ZoneGeometry as ZoneGeometry # type: ignore
    from .engine.imputer import Imputer as Imputer # type: ignore

def main() -> None:
    # Read input from stdin
    try:
        raw_input = sys.stdin.read()
        if not raw_input:
            return
        input_data = cast(List[Dict[str, Any]], json.loads(raw_input))
    except Exception as e:
        error_msg = f"Failed to parse input JSON: {str(e)}"
        print(json.dumps({"success": False, "error": error_msg}))
        return

    # Use Any cast for classes to prevent "non-class" linter errors
    CandidateClass: Any = Candidate
    AnalyzerClass: Any = ColumnAnalyzer
    WeightClass: Any = WeightEngine
    ZoneClass: Any = ZoneGeometry
    ImputerClass: Any = Imputer

    # Create candidate objects
    candidates: List[Any] = []
    for c in input_data:
        candidates.append(CandidateClass(c["name"], c["marks"]))

    columns: List[str] = ["10th", "12th", "Grad", "PG"]

    # Extract column values
    column_data: Dict[str, List[Optional[float]]] = {}
    for col in columns:
        column_data[col] = [c.marks[col] for c in candidates]

    # Analyze columns
    analyzers: Dict[str, Any] = {}
    weights: Dict[str, Tuple[float, float]] = {}
    zones: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}

    for col in columns:
        analyzer = AnalyzerClass(col, column_data[col])
        analyzers[col] = analyzer

        wc, wp = WeightClass.compute_weights(analyzer.stability_score)
        weights[col] = (wc, wp)

        zones[col] = ZoneClass(analyzer.min_val, analyzer.max_val)
        
        metadata[col] = {
            "stability_score": analyzer.stability_score,
            "weight_core": wc,
            "weight_peripheral": wp,
            "min_val": analyzer.min_val,
            "max_val": analyzer.max_val,
            "core_midpoint": zones[col].core_midpoint
        }

    # Imputation phase
    results: List[Dict[str, Any]] = []
    for candidate in candidates:
        original_marks = candidate.marks.copy()
        css = candidate.compute_css()
        imputations = {}

        for col in columns:
            if candidate.marks[col] is None:
                analyzer = analyzers[col]
                wc, wp = weights[col]
                bccv = getattr(zones[col], 'core_midpoint') # type: ignore

                # type: ignore for static analyzer
                predicted = ImputerClass.impute( # type: ignore
                    bccv,
                    css,
                    wc,
                    wp,
                    analyzer.min_val,
                    analyzer.max_val
                )

                candidate.marks[col] = round(float(predicted), 2) # type: ignore
                imputations[col] = candidate.marks[col]

        results.append({
            "name": candidate.name,
            "original_marks": original_marks,
            "normalized_marks": candidate.marks,
            "imputations": imputations
        })

    # Structured JSON Output
    output = {
        "success": True,
        "results": results,
        "metadata": metadata
    }
    
    print(json.dumps(output))

if __name__ == "__main__":
    main()
