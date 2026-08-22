from typing import Dict, Any, List, Optional
import numpy as np

class BoneRadiomicsAssessment:
    """Algorithms for integrating 3D CT radiomics, Hounsfield units, and DEXA scores."""

    @staticmethod
    def calculate_volumetric_density(hu_cortical: float, hu_trabecular: float) -> Dict[str, float]:
        """Convert Hounsfield units to calibrated volumetric bone mineral density (mg/cm³)."""
        v_bmd_cortical = 0.85 * hu_cortical + 120.0
        v_bmd_trabecular = 0.55 * hu_trabecular + 45.0
        return {
            "v_bmd_cortical_mg_cm3": round(v_bmd_cortical, 2),
            "v_bmd_trabecular_mg_cm3": round(v_bmd_trabecular, 2),
            "cortical_porosity_estimate_pct": round(max(2.0, (1200.0 - hu_cortical) / 12.0), 2)
        }

    @staticmethod
    def classify_t_score(t_score: float) -> Dict[str, str]:
        if t_score >= -1.0:
            return {"classification": "Normal Bone Mineral Density", "severity": "Low"}
        elif t_score > -2.5:
            return {"classification": "Osteopenia", "severity": "Moderate"}
        else:
            return {"classification": "Osteoporosis", "severity": "Severe"}

    @staticmethod
    def estimate_fracture_load(
        calcar_thickness_mm: float,
        midshaft_thickness_mm: float,
        t_score: float,
        bone_mineral_density: float
    ) -> Dict[str, Any]:
        """Biomechanical structural estimation of femoral neck fracture load capacity (N)."""
        base_capacity = 2500.0
        calcar_factor = (calcar_thickness_mm / 5.0) * 800.0
        midshaft_factor = (midshaft_thickness_mm / 6.0) * 400.0
        t_score_modifier = (t_score + 2.5) * 350.0
        bmd_modifier = (bone_mineral_density / 0.85) * 600.0

        estimated_n = max(900.0, base_capacity + calcar_factor + midshaft_factor + t_score_modifier + bmd_modifier - 1200.0)
        
        return {
            "estimated_fracture_load_n": round(estimated_n, 1),
            "critical_failure_site": "Subcapital / Calcar Femorale Interface" if calcar_thickness_mm < 4.0 else "Intertrochanteric Line",
            "cementless_pressfit_suitability": "Favorable" if (calcar_thickness_mm >= 4.5 and t_score > -2.0) else "Borderline / High Risk"
        }
