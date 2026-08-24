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

        # R4: Calcium High + PTH Low → PTH suppression by hypercalcemia
        if ca is not None and pth is not None and ca > 10.5 and pth < 15.0:
            relationships.append(DetectedRelationship(
                rule_id="R4_CALCIUM_PTH_SUPPRESSION",
                name="PTH Suppression by Hypercalcemia",
                involved_biomarkers=["Calcium", "PTH"],
                relationship_observation="Elevated serum calcium binds the calcium-sensing receptor (CaSR), suppressing parathyroid hormone production."
            ))

        # R5a: Calcium High + PTH also High → True Primary Hyperparathyroidism
        # (autonomous PTH secretion: both Ca AND PTH are elevated simultaneously)
        if ca is not None and pth is not None and ca > 10.5 and pth > 65.0:
            relationships.append(DetectedRelationship(
                rule_id="R5_AUTONOMOUS_PTH_PATTERN",
                name="Incongruent Calcium and PTH Activity (Primary Hyperparathyroidism)",
                involved_biomarkers=["Calcium", "PTH"],
                relationship_observation="Concurrent hypercalcemia with non-suppressed PTH signifies autonomous parathyroid secretion with high subperiosteal bone resorption risk."
            ))

        # R5b: Calcium High + PTH in normal range → Hypercalcemia with inappropriately
        # normal PTH (consider FHH, malignancy-related PTHrP, or granulomatous disease)
        elif ca is not None and pth is not None and ca > 10.5 and 15.0 <= pth <= 65.0:
            relationships.append(DetectedRelationship(
                rule_id="R5B_HYPERCALCEMIA_NORMAL_PTH",
                name="Hypercalcemia with Inappropriately Normal PTH",
                involved_biomarkers=["Calcium", "PTH"],
                relationship_observation="Hypercalcemia with a non-suppressed but not elevated PTH may indicate familial hypocalciuric hypercalcemia (FHH), malignancy-related PTHrP secretion, or granulomatous disease. Further workup is recommended."
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
        # Dynamically generated — only factors relevant to fired rules are included.
        # Each rule maps to its own human-readable factor + explanation pair.
        RULE_EXPLAINABILITY: Dict[str, ExplainabilityFactor] = {
            "R1_VITD_PTH_COMPENSATORY": ExplainabilityFactor(
                factor="Low Vitamin D",
                explanation="Vitamin D is below the selected reference context. 25(OH)D deficiency impairs enterocyte calbindin-D9k and TRPV6 synthesis, reducing intestinal calcium absorption and driving compensatory PTH elevation."
            ),
            "R2_VITD_CALCIUM_ABSORPTION": ExplainabilityFactor(
                factor="Vitamin D & Calcium Co-Depletion",
                explanation="Concurrent low Vitamin D and low Calcium signals decompensated intestinal mineral absorption. Implant osteointegration is significantly impaired when both substrates are insufficient."
            ),
            "R3_CALCIUM_PTH_FEEDBACK": ExplainabilityFactor(
                factor="Elevated PTH",
                explanation="PTH is above the selected reference context and is involved in calcium regulation and bone remodeling. Hypocalcemia continuously drives parathyroid chief cell exocytosis, accelerating cortical endosteal resorption."
            ),
            "R4_CALCIUM_PTH_SUPPRESSION": ExplainabilityFactor(
                factor="Hypercalcemia Suppressing PTH",
                explanation="Elevated serum calcium binds the calcium-sensing receptor (CaSR), suppressing parathyroid hormone production. Bone remodeling coupling is reduced."
            ),
            "R5_AUTONOMOUS_PTH_PATTERN": ExplainabilityFactor(
                factor="Primary Hyperparathyroidism Pattern",
                explanation="Non-suppressed PTH despite hypercalcemia indicates autonomous parathyroid adenoma secretion. High subperiosteal bone resorption risk compromises surgical fixation viability."
            ),
            "R6_VITD_PHOS_ABSORPTION": ExplainabilityFactor(
                factor="Low Phosphate",
                explanation="Phosphate is below the selected reference context and is relevant to calcium and phosphate absorption. Impaired intestinal phosphate uptake paired with secondary PTH phosphaturia results in defective unmineralized osteoid matrix (osteomalacia pattern)."
            ),
            "R7_ALP_PTH_TURNOVER": ExplainabilityFactor(
                factor="High Bone Turnover (ALP + PTH)",
                explanation="Elevated ALP and PTH together indicate high-turnover metabolic bone disease. PTH-driven osteoclastic resorption coupled with vigorous osteoblastic activity accelerates trabecular thinning."
            ),
            "R8_HYPOPARATHYROID_PATTERN": ExplainabilityFactor(
                factor="Blunted Parathyroid Response",
                explanation="Hypocalcemia without compensatory PTH elevation points to post-surgical or idiopathic hypoparathyroidism. Bone remodeling is suppressed, reducing dynamic implant osseointegration capacity."
            ),
            "R9_PHOS_PTH_INTERACTION": ExplainabilityFactor(
                factor="Elevated Phosphate",
                explanation="Phosphate is above the selected reference context. Renal phosphate retention complexes calcium and directly stimulates PTH gene transcription, leading to mixed uremic bone disease and impaired mineral homeostasis."
            ),
            "R10_ISOLATED_ALP": ExplainabilityFactor(
                factor="Isolated Alkaline Phosphatase Elevation",
                explanation="ALP is elevated with preserved systemic calcium and Vitamin D homeostasis, suggesting focal bone remodeling activity or a hepatobiliary source. Warrants site-specific radiographic correlation."
            ),
        }

        # Individual biomarker flags when no relationship rule fires for them
        INDIVIDUAL_EXPLAINABILITY: Dict[str, ExplainabilityFactor] = {
            "low_vitamin_d": ExplainabilityFactor(
                factor="Low Vitamin D",
                explanation="Vitamin D is below the selected reference context and is relevant to calcium and phosphate absorption. Sub-optimal 25(OH)D reduces intestinal mineral bioavailability and bone osteoid mineralization."
            ),
            "high_pth": ExplainabilityFactor(
                factor="Elevated PTH",
                explanation="PTH is above the selected reference context and is involved in calcium regulation and bone remodeling. Elevated parathyroid hormone output stimulates osteoclastic bone resorption."
            ),
            "low_calcium": ExplainabilityFactor(
                factor="Low Calcium",
                explanation="Serum calcium is below the reference range, reducing calcium-sensing receptor occupancy and stimulating rapid parathyroid hormone release with downstream cortical bone loss."
            ),
            "high_calcium": ExplainabilityFactor(
                factor="Elevated Calcium",
                explanation="Serum calcium is above the reference range. Hypercalcemia increases urinary excretion, suppresses PTH, and decreases bone remodeling coupling efficiency."
            ),
            "low_phosphate": ExplainabilityFactor(
                factor="Low Phosphate",
                explanation="Phosphate is below the selected reference context and is relevant to calcium and phosphate absorption. Hypophosphatemia limits hydroxyapatite crystal formation and bone matrix mineralization velocity."
            ),
            "high_phosphate": ExplainabilityFactor(
                factor="Elevated Phosphate",
                explanation="Phosphate is above the selected reference context. Hyperphosphatemia complexes serum ionized calcium and contributes to vascular calcification and stimulated PTH release."
            ),
            "high_alp": ExplainabilityFactor(
                factor="Elevated Alkaline Phosphatase",
                explanation="ALP is elevated, indicating accelerated osteoblastic bone formation or high skeletal remodeling turnover. Bone quality may be compromised even when bone quantity is preserved."
            ),
        }

        # Build dynamic explainability list from fired rules first
        seen_factors: set = set()
        explainability: List[ExplainabilityFactor] = []
        fired_rule_ids = {r.rule_id for r in relationships}

        for rule_id, factor_entry in RULE_EXPLAINABILITY.items():
            if rule_id in fired_rule_ids and factor_entry.factor not in seen_factors:
                explainability.append(factor_entry)
                seen_factors.add(factor_entry.factor)

        # Fall back to individual biomarker flags for anomalies not covered by a relationship rule
        if v_d is not None and v_d < 30.0 and "Low Vitamin D" not in seen_factors:
            explainability.append(INDIVIDUAL_EXPLAINABILITY["low_vitamin_d"])
            seen_factors.add("Low Vitamin D")
        if pth is not None and pth > 65.0 and "Elevated PTH" not in seen_factors:
            explainability.append(INDIVIDUAL_EXPLAINABILITY["high_pth"])
            seen_factors.add("Elevated PTH")
        if ca is not None and ca < 8.5 and "Low Calcium" not in seen_factors:
            explainability.append(INDIVIDUAL_EXPLAINABILITY["low_calcium"])
            seen_factors.add("Low Calcium")
        if ca is not None and ca > 10.5 and "Elevated Calcium" not in seen_factors:
            explainability.append(INDIVIDUAL_EXPLAINABILITY["high_calcium"])
            seen_factors.add("Elevated Calcium")
        if phos is not None and phos < 2.5 and "Low Phosphate" not in seen_factors:
            explainability.append(INDIVIDUAL_EXPLAINABILITY["low_phosphate"])
            seen_factors.add("Low Phosphate")
        if phos is not None and phos > 4.5 and "Elevated Phosphate" not in seen_factors:
            explainability.append(INDIVIDUAL_EXPLAINABILITY["high_phosphate"])
            seen_factors.add("Elevated Phosphate")
        if alp is not None and alp > 147.0 and "Elevated Alkaline Phosphatase" not in seen_factors:
            explainability.append(INDIVIDUAL_EXPLAINABILITY["high_alp"])
            seen_factors.add("Elevated Alkaline Phosphatase")

        return ComprehensiveAssessmentResponse(
            model_version="Models 4, 5 & 6 (Multi-Biomarker Endocrine Engine)",
            individual_assessments=individual,
            detected_relationships=relationships,
            explainability=explainability,
            disclaimer="Educational and analytical assessment engine only. Does not replace professional clinical diagnosis or orthopedic consultation."
        )
