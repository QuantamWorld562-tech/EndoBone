import os
from typing import Dict, Any, List
from app.schemas.simulation_schema import (
    SimulationRequest,
    SimulationResponse,
    StressDistribution,
    ClinicalSynthesisRequest,
    ClinicalSynthesisResponse
)
from app.services.model_service import ModelService
from app.ai.bone_assessment import BoneRadiomicsAssessment
from app.ai.biomarker_engine import BiomarkerRuleEngine
from app.core.config import settings

class SimulationService:
    @staticmethod
    def run_simulation(sim_req: SimulationRequest) -> SimulationResponse:
        model = ModelService.get_model_by_id(sim_req.model_id) or {}
        calcar = float(model.get("cortical_thickness_calcar_mm", 4.5))
        midshaft = float(model.get("cortical_thickness_midshaft_mm", 5.5))
        
        applied_load = sim_req.axial_load_n or 2500.0

        # Metabolic attenuation based on biomarkers
        metabolic_factor = 1.0
        guidance: List[str] = []
        if sim_req.biomarkers:
            assessment = BiomarkerRuleEngine.evaluate(sim_req.biomarkers)
            if any(r.rule_id == "R1_VITD_PTH_COMPENSATORY" for r in assessment.detected_relationships):
                metabolic_factor *= 0.85
                guidance.append("Elevated remodeling turnover secondary to low vitamin D attenuates effective load tolerance by 15%.")
            if any(r.rule_id == "R5_AUTONOMOUS_PTH_PATTERN" for r in assessment.detected_relationships):
                metabolic_factor *= 0.75
                guidance.append("Subperiosteal cortical resorption profile detected. Exercise caution with high-torque reaming.")

        # Estimate fracture capacity
        fracture_data = BoneRadiomicsAssessment.estimate_fracture_load(
            calcar_thickness_mm=calcar,
            midshaft_thickness_mm=midshaft,
            t_score=-1.5,
            bone_mineral_density=0.8
        )
        base_threshold = fracture_data["estimated_fracture_load_n"] * metabolic_factor

        calcar_stress = round((applied_load / (calcar * 12.0)) * 1.2, 1)
        subcapital_shear = round((applied_load / 180.0) * 0.95, 1)

        stress_dist = [
            StressDistribution(
                region="Calcar Femorale Cortex",
                von_mises_stress_mpa=calcar_stress,
                yield_risk_factor=round(min(1.0, calcar_stress / 120.0), 2),
                safety_margin=round(max(0.5, 120.0 / max(calcar_stress, 1.0)), 2)
            ),
            StressDistribution(
                region="Subcapital Compression Arc",
                von_mises_stress_mpa=subcapital_shear,
                yield_risk_factor=round(min(1.0, subcapital_shear / 100.0), 2),
                safety_margin=round(max(0.5, 100.0 / max(subcapital_shear, 1.0)), 2)
            ),
            StressDistribution(
                region="Diaphyseal Cortical Midshaft",
                von_mises_stress_mpa=round(calcar_stress * 0.65, 1),
                yield_risk_factor=round(min(1.0, (calcar_stress * 0.65) / 140.0), 2),
                safety_margin=round(max(0.5, 140.0 / max(calcar_stress * 0.65, 1.0)), 2)
            )
        ]

        risk_category = "Low Risk"
        if applied_load > base_threshold * 0.8:
            risk_category = "Elevated Fracture Risk"
        elif applied_load > base_threshold * 0.6:
            risk_category = "Moderate Risk"

        if not guidance:
            guidance.append("Standard surgical instrumentation and press-fit fixation parameters indicated.")

        return SimulationResponse(
            model_id=sim_req.model_id,
            applied_load_n=applied_load,
            estimated_fracture_threshold_n=round(base_threshold, 1),
            fracture_risk_category=risk_category,
            calcar_hoop_stress_mpa=calcar_stress,
            subcapital_shear_stress_mpa=subcapital_shear,
            stress_distribution=stress_dist,
            metabolic_attenuation_factor=round(metabolic_factor, 2),
            pre_surgical_guidance=guidance
        )

    @staticmethod
    async def generate_ai_synthesis(synth_req: ClinicalSynthesisRequest) -> ClinicalSynthesisResponse:
        model = ModelService.get_model_by_id(synth_req.model_id) or {}
        biomarkers = synth_req.biomarkers
        
        summary = (
            f"Cross-modal synthesis for Bone Model {model.get('Source', synth_req.model_id)}. "
            f"Calcar thickness: {model.get('cortical_thickness_calcar_mm')} mm, "
            f"Neck-shaft angle: {model.get('neck_shaft_angle_deg')} deg."
        )

        surgical = [
            "Evaluate calcar cortical bone stock prior to stem broaching.",
            "Consider dual-energy CT confirmation if osteoid unmineralization is suspected.",
            "Utilize collar-supported femoral component if calcar thickness < 4.0 mm."
        ]

        metabolic = [
            "Replete 25(OH)D to target > 30 ng/mL prior to elective joint replacement.",
            "Monitor serum calcium and intact PTH trajectory postoperatively.",
            "Assess dietary calcium fractional absorption and consider calcium citrate supplementation."
        ]

        markdown = f"""### Comprehensive Clinical Synthesis & Orthopedic Consultation Report

**Target Subject:** Bone Asset `{model.get('Source', synth_req.model_id)}`  
**Anatomical Classification:** {model.get('case_label', 'Proximal Femur Assessment')}  

#### 1. Geometrical & 3D CT Morphometry
- **Neck-Shaft Angle:** {model.get('neck_shaft_angle_deg', 128.0)}°
- **Calcar Cortical Thickness:** {model.get('cortical_thickness_calcar_mm', 4.5)} mm
- **Diaphyseal Midshaft Thickness:** {model.get('cortical_thickness_midshaft_mm', 5.5)} mm
- **Mechanical Axis Span:** {model.get('ma_length', 343.0):.1f} mm

#### 2. Endocrine & Metabolic Biomarker Profile
- **25(OH) Vitamin D:** {biomarkers.vitamin_d if biomarkers and biomarkers.vitamin_d is not None else 'Unspecified'} ng/mL
- **Intact PTH:** {biomarkers.pth if biomarkers and biomarkers.pth is not None else 'Unspecified'} pg/mL
- **Serum Calcium:** {biomarkers.calcium if biomarkers and biomarkers.calcium is not None else 'Unspecified'} mg/dL
- **Alkaline Phosphatase:** {biomarkers.alp if biomarkers and biomarkers.alp is not None else 'Unspecified'} U/L

#### 3. Integrated Surgical Guidance
{" ".join(surgical)}
"""

        return ClinicalSynthesisResponse(
            synthesisMarkdown=markdown,
            boneQualitySummary=summary,
            surgicalConsiderations=surgical,
            metabolicRecommendations=metabolic
        )
