EndoBone AI – AI-Assisted 3D Bone Assessment & Pre-Surgical Planning

EndoBone AI is a web-based clinical decision-support prototype that integrates interactive 3D femur anatomy with endocrine and metabolic biomarkers to provide patient-specific contextual assessment and support pre-surgical planning workflows.

The platform brings anatomical and physiological information together through an interactive 3D workspace and biomarker assessment involving Vitamin D, PTH, Calcium, Phosphate, and ALP.

Disclaimer: EndoBone AI is a research and innovation prototype developed for demonstration, education, and decision-support workflow exploration. It has not undergone clinical validation and is not intended for diagnosis, treatment decisions, autonomous surgical planning, implant selection, or replacement of professional medical judgment.

🚀 Live Prototype

Frontend:
https://endo-bone.vercel.app

Backend API:
https://endobone.onrender.com

🎯 Problem

In pre-operative orthopedic workflows, anatomical information from 3D bone models or medical imaging and physiological information from laboratory biomarkers may be reviewed separately.

Relevant endocrine and metabolic biomarkers such as Vitamin D, PTH, Calcium, Phosphate, and ALP can provide additional physiological context for bone assessment.

EndoBone AI addresses this information gap by bringing:

3D Bone Anatomy + Biomarkers + Explainable Assessment + Patient-Specific Planning

into a single digital workflow.

💡 Solution

EndoBone AI provides a unified web-based workspace that allows users to:

Create or select a patient case
Load an interactive 3D femur model
Enter endocrine and metabolic biomarker values
Assess biomarker patterns and relationships
Generate an AI-assisted contextual assessment
Explore anatomical regions
Select and annotate Regions of Interest (ROI)
Add planning notes and annotations
Compare planning configurations
Generate structured planning information and reports

The platform is designed as a decision-support workflow prototype, with clinical interpretation and final decisions remaining with qualified healthcare professionals.

✨ Key Features
1. Multi-Modal Clinical Workspace

Combines:

Interactive 3D femur anatomy
Vitamin D
PTH
Total Calcium
Phosphate
ALP
Case-specific planning information

This allows anatomical and physiological information to be reviewed within the same case workflow.

2. Interactive 3D Anatomical Workspace

The 3D workspace supports:

Femur model visualization
Rotation
Zoom
Pan
View reset
Anatomical region exploration
Region of Interest (ROI) selection
Planning annotations
3. AI-Assisted Contextual Assessment

The current assessment system uses a modular, explainable rule-based engine to evaluate entered biomarker values and relevant relationships.

It provides:

Reference-range assessment
Identification of abnormal biomarker values
Biomarker relationship analysis
Contributing factors
Contextual assessment
Explainable assessment output

The AI engine analyzes biomarker patterns and relationships and presents the resulting assessment alongside the 3D anatomical context to support pre-surgical planning.

The current system is rule-based and not clinically validated.

4. Biomarker Relationship Analysis

EndoBone AI considers relationships between relevant biomarkers rather than viewing every laboratory value independently.

Core relationships include:

Vitamin D ↔️ PTH ↔️ Calcium ↔️ Phosphate ↔️ ALP

The resulting information is presented as physiological context alongside the 3D anatomical workspace.

5. Patient-Specific Planning

The platform supports case-specific planning through:

Anatomical region selection
ROI marking
Planning annotations
Planning notes
Scenario-based planning configurations
Structured planning documentation
6. Structured Reporting

The workflow can organize relevant case information into structured planning documentation, including:

Case information
Biomarker values
Contextual assessment
Contributing factors
Anatomical observations
ROI information
Planning annotations
Planning summary
🔄 End-to-End Workflow
Patient Case
      ↓
3D Femur Model + Biomarker Input
      ↓
AI-Assisted Contextual Assessment
      ↓
Biomarker Relationship Analysis
      ↓
3D Anatomical Context
      ↓
ROI & Planning Annotation
      ↓
Scenario-Based Planning
      ↓
Planning Summary / Report
🧪 Demonstration Cases

The prototype includes synthetic demonstration cases to illustrate different biomarker patterns and the contextual assessment workflow.

Case 1 – Baseline / Stable
PTH: 42 pg/mL
Vitamin D: 45 ng/mL
Calcium: 9.6 mg/dL
Phosphate: 3.5 mg/dL
ALP: 78 IU/L
CTX-I: 85 pg/mL

Demonstrates: Baseline contextual assessment.

Case 2 – Vitamin D / PTH Pattern
PTH: 72 pg/mL
Vitamin D: 11 ng/mL
Calcium: 9.0 mg/dL
Phosphate: 3.0 mg/dL
ALP: 128 IU/L
CTX-I: 180 pg/mL

Demonstrates: Low Vitamin D with elevated PTH and contextual biomarker relationship analysis.

Case 3 – Multi-Marker Pattern
PTH: 118 pg/mL
Vitamin D: 24 ng/mL
Calcium: 10.8 mg/dL
Phosphate: 2.4 mg/dL
ALP: 142 IU/L
CTX-I: 20 pg/mL

Demonstrates: A multi-marker biochemical pattern involving PTH, Vitamin D, Calcium, and Phosphate.

Note: All demonstration cases use synthetic values. They do not represent real patients and should not be interpreted as clinical diagnoses or validated predictions.

🧠 Core Innovation

The core innovation of EndoBone AI is the integration of anatomical and physiological information within a single patient-specific workflow.

1. 3D Anatomy

Interactive visualization of the femur and relevant anatomical regions.

2. Physiological Biomarkers

Integration of endocrine and metabolic biomarker information.

3. Explainable Assessment

Rule-based analysis of biomarker values and relationships with contextual output.

4. Patient-Specific Planning

ROI selection, annotations, planning configurations, and structured planning information within the same workflow.

USP

EndoBone AI integrates 3D anatomy, physiological biomarkers, and explainable assessment into a single patient-specific pre-surgical planning platform.

“EndoBone AI connects what the bone looks like with the physiological context behind it.”

🛠️ Technology Stack
Frontend
React 18
Vite
Three.js
React Three Fiber
Drei
Zustand
React Router DOM v6
Tailwind CSS
Lucide
Axios
Backend
Python
FastAPI
Pydantic
REST API
Database
MongoDB Atlas
AI & Decision Support
Modular Rule-Based Expert Engine
Gemini API
Deployment
Frontend: Vercel
Backend: Render
Database: MongoDB Atlas
🏗️ System Architecture
                         EndoBone AI
                              │
             ┌────────────────┴────────────────┐
             │                                 │
      React Frontend                    3D Visualization
             │                         Three.js / R3F
             │                                 │
             └────────────────┬────────────────┘
                              │
                          REST API
                              │
                       FastAPI Backend
                              │
             ┌────────────────┼────────────────┐
             │                │                │
           Cases          Assessment        Planning
             │                │                │
             │         Rule-Based Engine      │
             │         + Gemini API           │
             │                │                │
             └────────────────┼────────────────┘
                              │
                         MongoDB Atlas
📁 Project Structure
EndoBone/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── styles/
│   │   └── ...
│   └── package.json
│
├── server/
│   ├── app/
│   │   ├── ai/
│   │   ├── core/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── services/
│   ├── main.py
│   └── requirements.txt
│
├── docs/
│
└── README.md
🔬 Data & Knowledge Foundation

The current prototype uses:

Publicly available 3D femur models
Research-based biomarker relationships
Published scientific literature and clinical guidelines
Synthetic demonstration cases

The prototype does not depend on proprietary hospital patient data.

Clinical datasets, expert review, and appropriate validation would be required for future clinical development and machine-learning applications.

⚕️ Current Limitations

EndoBone AI is currently a research and innovation prototype.

The current system:

Has not undergone clinical validation
Is not intended to diagnose disease
Does not autonomously determine treatment
Does not independently select implants
Does not replace professional medical judgment
Does not provide validated fracture-risk prediction
Does not provide validated surgical-outcome prediction
Does not provide autonomous surgical recommendations

The current AI component is an explainable rule-based assessment engine.

🔮 Future Scope

Future development may include:

Clinician-reviewed and larger clinical datasets
Clinical validation
Validated machine-learning models
Additional anatomical structures
Additional biomarkers and clinical parameters
Broader imaging integration
Evidence-backed knowledge retrieval
Expanded clinical workflow integration
Multi-centre evaluation
Regulatory assessment where applicable

The long-term goal is to evolve the prototype from a femur-focused workflow toward a broader multimodal clinical decision-support platform.

📈 Scalability

The modular architecture allows future expansion across:

Anatomy

Femur → Hip → Tibia → Spine → Additional anatomical structures

Clinical Information

Biomarkers → Clinical Parameters → Imaging Information → Additional Patient Context

AI

Rule-Based Reasoning → Validated Machine Learning → Multimodal AI

💼 Potential Applications
Orthopedic Workflows

Digital pre-operative case review, anatomical visualization, and structured planning documentation.

Clinical Review

Bringing anatomical and physiological information together within a single case workflow.

Medical Education

Interactive 3D anatomy with clinically contextualized biomarker information.

Research

A foundation for future anatomy–biomarker analysis and multimodal clinical AI research.

👥 Team – ALike Coders
Sristika Bhattacharyya
Kunal
Haimanti
Shayan
Sankha Subhra
Minhaj
📚 Research Foundation

The prototype is informed by published literature and clinical guidance related to endocrine and metabolic factors relevant to bone health.

Key References
Bilezikian JP et al. Evaluation and Management of Primary Hyperparathyroidism: Summary Statement and Guidelines from the Fifth International Workshop. Journal of Bone and Mineral Research, 2022.
Demay MB et al. Vitamin D for the Prevention of Disease: An Endocrine Society Clinical Practice Guideline. Journal of Clinical Endocrinology & Metabolism, 2024.
KDIGO. 2017 Clinical Practice Guideline Update for CKD-MBD. Kidney International Supplements, 2017.
Holick MF. Vitamin D Deficiency. New England Journal of Medicine, 2007.
Siller AF, Whyte MP. Alkaline Phosphatase: Discovery and Naming of Our Favorite Enzyme. Journal of Bone and Mineral Research, 2018.
Uday S, Högler W. Osteomalacia and Vitamin D Status: A Clinical Update 2020. JBMR Plus, 2021.
SMART-KNEE Bone Morphology Dataset – publicly available femur model dataset used during prototype development.
🏁 Vision

EndoBone AI aims to create a unified environment where 3D anatomy, physiological information, and explainable AI-assisted assessment can be viewed together.

“EndoBone AI connects what the bone looks like with the physiological context behind it.”

