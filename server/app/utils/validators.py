import re
from typing import Optional

def validate_case_id(case_id: str) -> bool:
    """Validate case ID formatting."""
    if not case_id or len(case_id.strip()) == 0:
        return False
    return bool(re.match(r'^[A-Za-z0-9\-_]+$', case_id.strip()))

def validate_biomarker_value(key: str, value: Optional[float]) -> bool:
    if value is None:
        return True
    ranges = {
        "vitamin_d": (0.0, 300.0),
        "pth": (0.0, 1000.0),
        "calcium": (2.0, 25.0),
        "phosphate": (0.0, 15.0),
        "alp": (0.0, 2000.0)
    }
    if key in ranges:
        min_v, max_v = ranges[key]
        return min_v <= value <= max_v
    return True
