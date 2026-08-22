from typing import Dict, Any, List, Optional
from app.schemas.assessment_schema import (
    IndividualAssessment,
    DetectedRelationship,
    ExplainabilityFactor,
    ComprehensiveAssessmentResponse
)
from app.schemas.biomarker_schema import BiomarkerInput

REFERENCE_RANGES: Dict[str, Dict[str, Any]] = {
    "vitamin_d": {
        "min": 30.0,
        "max": 100.0,
        "unit": "ng/mL",
        "name": "25-Hydroxyvitamin D",
        "description": "Standard adult circulating substrate for 1,25(OH)2D synthesis and intestinal calcium transport."
    },
    "pth": {
        "min": 15.0,
        "max": 65.0,
        "unit": "pg/mL",
        "name": "Intact Parathyroid Hormone",
        "description": "Primary regulator of serum ionized calcium via bone resorption and renal conservation."
    },
    "calcium": {
        "min": 8.5,
        "max": 10.5,
        "unit": "mg/dL",
        "name": "Total Serum Calcium",
        "description": "Essential extracellular mineral cation for neuromuscular signaling and bone matrix mineral density."
    },
    "phosphate": {
        "min": 2.5,
        "max": 4.5,
        "unit": "mg/dL",
        "name": "Serum Inorganic Phosphate",
        "description": "Co-precipitant in calcium hydroxyapatite crystalline bone matrix."
    },
    "alp": {
        "min": 44.0,
        "max": 147.0,
        "unit": "U/L",
        "name": "Total Alkaline Phosphatase",
        "description": "Enzyme marker of osteoblastic bone formation and turnover rate."
    }
}

class BiomarkerRuleEngine:
    """Implementation of Models 4, 5, and 6 rule evaluation engines."""

    @staticmethod
    def evaluate(input_data: BiomarkerInput) -> ComprehensiveAssessmentResponse:
        v_d = input_data.vitamin_d
        pth = input_data.pth
        ca = input_data.calcium
        phos = input_data.phosphate
        alp = input_data.alp

        # Model 4: Contextual Observations (Individual Biomarkers)
        individual: List[IndividualAssessment] = []

        # 1. Vitamin D
        if v_d is not None:
            if v_d < 20.0:
                individual.append(IndividualAssessment(
                    biomarker="25-Hydroxyvitamin D",
                    value=v_d,
                    unit="ng/mL",
                    status="below_reference_context",
                    observation="Deficiency level. Reduced intestinal calcium/phosphate fractional absorption, inducing secondary parathyroid compensation."
                ))
            elif v_d < 30.0:
                individual.append(IndividualAssessment(
                    biomarker="25-Hydroxyvitamin D",
                    value=v_d,
                    unit="ng/mL",
                    status="below_reference_context",
                    observation="Insufficiency level. Sub-optimal mineralization substrate for newly synthesized bone osteoid."
                ))
            elif v_d > 100.0:
                individual.append(IndividualAssessment(
                    biomarker="25-Hydroxyvitamin D",
                    value=v_d,
                    unit="ng/mL",
                    status="above_reference_context",
                    observation="Elevated level. Potential exogenous hypervitaminosis D risking hypercalcemia and nephrocalcinosis."
                ))
            else:
                individual.append(IndividualAssessment(
                    biomarker="25-Hydroxyvitamin D",
                    value=v_d,
                    unit="ng/mL",
                    status="within_reference_context",
                    observation="Optimal systemic substrate level for active 1,25(OH)2D synthesis."
                ))

        # 2. PTH
        if pth is not None:
            if pth < 15.0:
                individual.append(IndividualAssessment(
                    biomarker="Parathyroid Hormone (PTH)",
                    value=pth,
                    unit="pg/mL",
                    status="below_reference_context",
                    observation="Suppressed parathyroid secretion. Suggestive of primary hypoparathyroidism or negative feedback from hypercalcemia."
                ))
            elif pth > 65.0:
                individual.append(IndividualAssessment(
                    biomarker="Parathyroid Hormone (PTH)",
                    value=pth,
                    unit="pg/mL",
                    status="above_reference_context",
                    observation="Elevated parathyroid hormone output. Indicates secondary compensation for calcium/vitamin D deficit, or autonomous adenoma secretion."
                ))
            else:
                individual.append(IndividualAssessment(
                    biomarker="Parathyroid Hormone (PTH)",
                    value=pth,
                    unit="pg/mL",
                    status="within_reference_context",
                    observation="Parathyroid gland secretion is balanced within physiological homeostatic limits."
                ))

        # 3. Calcium
        if ca is not None:
            if ca < 8.5:
                individual.append(IndividualAssessment(
                    biomarker="Serum Calcium",
                    value=ca,
                    unit="mg/dL",
                    status="below_reference_context",
                    observation="Hypocalcemia. Decreased calcium-sensing receptor occupancy stimulates rapid parathyroid hormone release."
                ))
            elif ca > 10.5:
                individual.append(IndividualAssessment(
                    biomarker="Serum Calcium",
                    value=ca,
                    unit="mg/dL",
                    status="above_reference_context",
                    observation="Hypercalcemia. Elevated serum ionized calcium increases urinary excretion and decreases bone remodeling coupling."
                ))
            else:
                individual.append(IndividualAssessment(
                    biomarker="Serum Calcium",
                    value=ca,
                    unit="mg/dL",
                    status="within_reference_context",
                    observation="Circulating calcium level supports normal neuromuscular signaling and bone matrix stability."
                ))

        # 4. Phosphate
        if phos is not None:
            if phos < 2.5:
                individual.append(IndividualAssessment(
                    biomarker="Serum Phosphate",
                    value=phos,
                    unit="mg/dL",
                    status="below_reference_context",
                    observation="Hypophosphatemia. Limits hydroxyapatite crystal formation and bone matrix mineralization velocity."
                ))
            elif phos > 4.5:
                individual.append(IndividualAssessment(
                    biomarker="Serum Phosphate",
                    value=phos,
                    unit="mg/dL",
                    status="above_reference_context",
                    observation="Hyperphosphatemia. Complexes serum ionized calcium, contributing to vascular calcification and stimulating PTH release."
                ))
            else:
                individual.append(IndividualAssessment(
                    biomarker="Serum Phosphate",
                    value=phos,
                    unit="mg/dL",
                    status="within_reference_context",
                    observation="Phosphate level is within normal homeostatic range for hydroxyapatite formation."
                ))

        # 5. ALP
        if alp is not None:
            if alp > 147.0:
                individual.append(IndividualAssessment(
                    biomarker="Alkaline Phosphatase (ALP)",
                    value=alp,
                    unit="U/L",
                    status="above_reference_context",
                    observation="Elevated alkaline phosphatase indicating accelerated osteoblastic bone formation or high skeletal remodeling turnover."
                ))
            elif alp < 44.0:
                individual.append(IndividualAssessment(
                    biomarker="Alkaline Phosphatase (ALP)",
                    value=alp,
                    unit="U/L",
                    status="below_reference_context",
                    observation="Low alkaline phosphatase, seen in hypophosphatasia, severe malnutrition, or over-suppressed bone turnover."
                ))
            else:
                individual.append(IndividualAssessment(
                    biomarker="Alkaline Phosphatase (ALP)",
                    value=alp,
                    unit="U/L",
                    status="within_reference_context",
                    observation="Alkaline phosphatase activity within standard physiological remodeling range."
                ))

        # Model 5: Multi-Biomarker Interaction Rules (R1 - R10)
        relationships: List[DetectedRelationship] = []

        # R1: Vit D Low + PTH High
        if v_d is not None and pth is not None and v_d < 30.0 and pth > 65.0:
            relationships.append(DetectedRelationship(
                rule_id="R1_VITD_PTH_COMPENSATORY",
                name="Vitamin D & PTH Inverse Dynamic (Secondary Hyperparathyroidism)",
                involved_biomarkers=["Vitamin D", "PTH"],
                relationship_observation="Sub-optimal 25(OH)D impairs intestinal calcium absorption, triggering a compensatory increase in PTH secretion to mobilize skeletal calcium reserves."
            ))

        # R2: Vit D Low + Calcium Low
        if v_d is not None and ca is not None and v_d < 30.0 and ca < 8.5:
            relationships.append(DetectedRelationship(
                rule_id="R2_VITD_CALCIUM_ABSORPTION",
                name="Vitamin D & Calcium Concurrent Depletion Axis",
                involved_biomarkers=["Vitamin D", "Calcium"],
                relationship_observation="Combined low substrate and circulating calcium indicates decompensated intestinal fractional absorption, blunting implant osteointegration."
            ))

        # R3: Calcium Low + PTH High
        if ca is not None and pth is not None and ca < 8.5 and pth > 65.0:
            relationships.append(DetectedRelationship(
                rule_id="R3_CALCIUM_PTH_FEEDBACK",
                name="Classic Calcium-PTH Negative Feedback Arc",
                involved_biomarkers=["Calcium", "PTH"],
                relationship_observation="Hypocalcemia continuously drives parathyroid chief cell exocytosis, accelerating cortical endosteal resorption."
            ))

        # R4: Calcium High + PTH Low
        if ca is not None and pth is not None and ca > 10.5 and pth < 15.0:
            relationships.append(DetectedRelationship(
                rule_id="R4_CALCIUM_PTH_SUPPRESSION",
                name="PTH Suppression by Hypercalcemia",
                involved_biomarkers=["Calcium", "PTH"],
                relationship_observation="Elevated serum calcium binds the calcium-sensing receptor (CaSR), suppressing parathyroid hormone production."
            ))

        # R5: Calcium High + PTH Inappropriately Normal/High (Primary Hyperparathyroidism)
        if ca is not None and pth is not None and ca > 10.5 and pth >= 15.0:
            relationships.append(DetectedRelationship(
                rule_id="R5_AUTONOMOUS_PTH_PATTERN",
                name="Incongruent Calcium and PTH Activity (Primary Hyperparathyroidism)",
                involved_biomarkers=["Calcium", "PTH"],
                relationship_observation="Concurrent hypercalcemia with non-suppressed PTH signifies autonomous parathyroid secretion with high subperiosteal bone resorption risk."
            ))

        # R6: Vit D Low + Phosphate Low
        if v_d is not None and phos is not None and v_d < 30.0 and phos < 2.5:
            relationships.append(DetectedRelationship(
                rule_id="R6_VITD_PHOS_ABSORPTION",
                name="Vitamin D & Phosphate Co-Depletion (Osteomalacia Pattern)",
                involved_biomarkers=["Vitamin D", "Phosphate"],
                relationship_observation="Impaired intestinal phosphate uptake paired with secondary PTH phosphaturia results in defective unmineralized osteoid matrix."
            ))

        # R7: ALP High + PTH High
        if alp is not None and pth is not None and alp > 147.0 and pth > 65.0:
            relationships.append(DetectedRelationship(
                rule_id="R7_ALP_PTH_TURNOVER",
                name="Coupled High Bone Turnover Dynamic",
                involved_biomarkers=["ALP", "PTH"],
                relationship_observation="PTH-driven osteoclastic resorption coupled with vigorous osteoblastic alkaline phosphatase synthesis indicates high-turnover metabolic bone disease."
            ))

        # R8: Calcium Low + PTH Low
        if ca is not None and pth is not None and ca < 8.5 and pth < 15.0:
            relationships.append(DetectedRelationship(
                rule_id="R8_HYPOPARATHYROID_PATTERN",
                name="Blunted Parathyroid Response Pattern",
                involved_biomarkers=["Calcium", "PTH"],
                relationship_observation="Hypocalcemia occurring without compensatory PTH elevation points to post-surgical or idiopathic hypoparathyroidism."
            ))

        # R9: Phosphate High + PTH High
        if phos is not None and pth is not None and phos > 4.5 and pth > 65.0:
            relationships.append(DetectedRelationship(
                rule_id="R9_PHOS_PTH_INTERACTION",
                name="Phosphate-PTH Mineral Dynamic (Renal Osteodystrophy Pattern)",
                involved_biomarkers=["Phosphate", "PTH"],
                relationship_observation="Renal phosphate retention complexes calcium and directly stimulates PTH gene transcription, leading to mixed uremic bone disease."
            ))

        # R10: Isolated ALP High with Normal Vit D & Calcium
        if alp is not None and alp > 147.0:
            vit_d_normal = v_d is None or (30.0 <= v_d <= 100.0)
            ca_normal = ca is None or (8.5 <= ca <= 10.5)
            if vit_d_normal and ca_normal:
                relationships.append(DetectedRelationship(
                    rule_id="R10_ISOLATED_ALP",
                    name="Isolated Alkaline Phosphatase Elevation",
                    involved_biomarkers=["ALP", "Vitamin D", "Calcium"],
                    relationship_observation="Isolated elevation of tissue non-specific ALP with preserved systemic calcium/vitamin D homeostasis suggests focal bone remodeling or hepatobiliary origin."
                ))

        # Model 6: Explainability & Contributing Factors
        explainability: List[ExplainabilityFactor] = [
            ExplainabilityFactor(
                factor="Intestinal Mineral Bioavailability",
                explanation="25(OH)D is required for enterocyte synthesis of calbindin-D9k and TRPV6 channels, governing 80-90% of dietary calcium absorption."
            ),
            ExplainabilityFactor(
                factor="Parathyroid Chief Cell Sensitivity (CaSR)",
                explanation="Calcium-sensing receptors on the parathyroid gland modulate hormone exocytosis within seconds of ionized calcium fluctuations."
            ),
            ExplainabilityFactor(
                factor="Skeletal Remodeling Balance (RANKL/OPG Axis)",
                explanation="Elevated PTH shifts the osteoblast RANKL/OPG ratio, promoting osteoclastogenesis and cortical endocortical tunneling."
            ),
            ExplainabilityFactor(
                factor="Pre-Surgical Orthopedic Fixation Viability",
                explanation="Metabolic bone turnover status directly dictates primary mechanical stability of cementless porous implants versus cemented fixations."
            )
        ]

        return ComprehensiveAssessmentResponse(
            model_version="Models 4, 5 & 6 (Multi-Biomarker Endocrine Engine)",
            individual_assessments=individual,
            detected_relationships=relationships,
            explainability=explainability,
            disclaimer="Educational and analytical assessment engine only. Does not replace professional clinical diagnosis or orthopedic consultation."
        )
