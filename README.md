# EndoBone AI :   AI-Assisted 3D Bone Assessment & Pre-Surgical Planning

EndoBone AI is a web-based clinical decision-support prototype that integrates interactive 3D femur anatomy with endocrine and metabolic biomarkers to provide patient-specific contextual assessment and support pre-surgical planning workflows.

The platform brings anatomical and physiological information together through an interactive 3D workspace and biomarker assessment involving Vitamin D, PTH, Calcium, Phosphate, and ALP.

The platform consists of a **React/Vite Frontend** and a **FastAPI/Python Backend**.

---
Frontend-https://endo-bone.vercel.app     
Backend-https://endobone.onrender.com 
## 🧩 Problem
In pre-operative orthopaedic workflows, anatomical information from 3D bone models or medical imaging and physiological information from laboratory biomarkers may be reviewed separately.

Relevant endocrine and metabolic biomarkers such as Vitamin D, PTH, Calcium, Phosphate, and ALP can provide additional physiological context for bone assessment.

EndoBone AI addresses this information gap by bringing:

3D Bone Anatomy + Biomarkers + Explainable Assessment + Patient-Specific Planning

into a single digital workflow.

## ✅ Solution 
EndoBone AI provides a unified web-based workspace that allows users to:

- **Create or select a patient case**
- **Load an interactive 3D femur model**
- **Enter endocrine and metabolic biomarker values**
- **Assess biomarker patterns and relationships**
- **Generate an AI-assisted contextual assessment**
- **Explore anatomical regions**
- **Select and annotate Regions of Interest (ROI)**
- **Add planning notes and annotations**
- **Compare planning configurations**
- **Generate structured planning information and reports**

The platform is designed as a decision-support workflow prototype, with clinical interpretation and final decisions remaining with qualified healthcare professionals.
## 🌟 Key Features

### 1. 🏥 Multi-Modal Clinical Workspace :-
- **Interactive 3D femur**
- **Vitamin D, PTH, Calcium, Phosphate & ALP**
- **Case-specific planning information**
- **Unified anatomical + physiological view**
### 2. 🖥️ Interactive 3D Anatomical Workspace :-
- **3D femur visualisation**
- **Rotate, zoom, pan & reset**
- **Anatomical region exploration**
- **ROI selection & planning annotations**
### 3. 🤖 AI-Assisted Contextual Assessment
- **Explainable rule-based assessment**
- **Reference-range & abnormality analysis**
- **Biomarker relationship analysis**
- **Contributing factors & contextual insights**
- **Not clinically validated**
### 4. 🔗 Biomarker Relationship Analysis :-
- **Evaluates biomarker patterns and relationships**
- **Vitamin D ↔️ PTH ↔️ Calcium ↔️ Phosphate ↔️ ALP**
- **Provides physiological context alongside 3D anatomy**
### 5. 📋 Patient-Specific Planning :-
- **Anatomical region selection**
- **ROI marking & annotations**
- **Planning notes**
- **Scenario-based planning configurations**
- **Structured planning documentation**
### 6. 📄 Structured Reporting :-
- **Case information**
- **Biomarker assessment**
- **Contextual findings & contributing factors**
- **Anatomical observations**
- **ROI & planning annotations**
- **Planning summary**



---

## 🏗️ Architecture & Folder Structure

```
├── client/                       # React Frontend (Vite, Tailwind, Three.js)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Reusable UI widgets (e.g. RiskDonut)
│   │   │   ├── layout/           # Global layout (Sidebar, TopBar)
│   │   │   └── views/            # Clinical workflow views
│   │   ├── context/              # Global state management
│   │   ├── data/                 # Mock data fallbacks
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API communication layer
│   │   └── styles/               # Global CSS
│   └── package.json
│
├── server/                       # FastAPI Backend (Python, MongoDB)
│   ├── app/
│   │   ├── ai/                   # AI Rule Engine & Biomarker logic
│   │   ├── core/                 # Config & Database connection
│   │   ├── routes/               # API Endpoints (Auth, Cases, Assessment)
│   │   ├── schemas/              # Pydantic data models
│   │   └── services/             # Core business logic
│   ├── main.py                   # FastAPI entrypoint
│   └── requirements.txt
│
└── docs/                         # Project & architecture documentation
```

---

## 🧪 Demonstration Cases 

The prototype includes synthetic demonstration cases to illustrate different biomarker patterns and the contextual assessment workflow.

- **Case 1 – Baseline / Stable:** 
PTH: 42 pg/mL
Vitamin D: 45 ng/mL
Calcium: 9.6 mg/dL
Phosphate: 3.5 mg/dL
ALP: 78 IU/L
CTX-I: 85 pg/mL

Demonstrates: Baseline contextual assessment.

- **Case 2 – Vitamin D / PTH Pattern:**                                                                         
PTH: 72 pg/mL
Vitamin D: 11 ng/mL
Calcium: 9.0 mg/dL
Phosphate: 3.0 mg/dL
ALP: 128 IU/L
CTX-I: 180 pg/mL

Demonstrates: Low Vitamin D with elevated PTH and contextual biomarker relationship analysis.

- **Case 3 – Multi-Marker Pattern:**
PTH: 118 pg/mL
Vitamin D: 24 ng/mL
Calcium: 10.8 mg/dL
Phosphate: 2.4 mg/dL
ALP: 142 IU/L
CTX-I: 20 pg/mL

Demonstrates: A multi-marker biochemical pattern involving PTH, Vitamin D, Calcium, and Phosphate.

## 📝 Note
 All demonstration cases use synthetic values. They do not represent real patients and should not be interpreted as clinical diagnoses or validated predictions.

## 💡 Core Innovation

The core innovation of EndoBone AI is the integration of anatomical and physiological information within a single patient-specific workflow.

- **1. 3D Anatomy:**
Interactive visualisation of the femur and relevant anatomical regions.

- **2. Physiological Biomarkers:**
Integration of endocrine and metabolic biomarker information.

- **3. Explainable Assessment:**
Rule-based analysis of biomarker values and relationships with contextual output.

- **4. Patient-Specific Planning:**
ROI selection, annotations, planning configurations, and structured planning information within the same workflow.

## 🎯 USP
EndoBone AI integrates 3D anatomy, physiological biomarkers, and explainable assessment into a single patient-specific pre-surgical planning platform.

## “EndoBone AI connects what the bone looks like with the physiological context behind it.”
## 🚀 Quick Start

### 1. Frontend (React/Vite)

```bash
cd client

# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev
```

### 2. Backend (FastAPI/Python)

Requires Python 3.9.6 (or compatible 3.9+ version).


```bash
cd server

# Create and activate virtual environment (macOS/Linux)
python3 -m venv venv
source venv/bin/activate
# For Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (runs on http://localhost:8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Note:** The backend uses MongoDB. If no `MONGODB_URI` is provided in `server/.env`, it will gracefully fall back to local JSON storage (`server/data/bone_health_store.json`), allowing the app to run completely out-of-the-box.

---

## 🔌 API Endpoints

The frontend proxy (`vite.config.js`) forwards `/api/*` requests from the Vite dev server to the FastAPI backend. 

Key endpoints available on the backend:
- `POST /api/auth/register` - Create a clinician account
- `POST /api/auth/login` - Authenticate and get a JWT token
- `GET /api/cases` - List patient cases
- `POST /api/assessments/analyze` - Run the biomarker rule engine and calculate risk score
- `PUT /api/assessments/:id/notes` - Save surgical planning notes
- `GET /api/health` - Server health check

---

## ☁️ Deployment

### Backend (Render)
The backend is configured for deployment on [Render.com](https://render.com). 
1. Create a New Web Service pointing to the `server` root directory.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set the `MONGODB_URI` environment variable to a MongoDB Atlas connection string.

### Frontend (Vercel/Render)
Update `client/.env` to point `VITE_API_URL` to your live backend URL, then deploy the `client` directory to Vercel or Render.

---
## ⚠️ Current Limitations

EndoBone AI is currently a research and innovation prototype.

The current system:

- **Has not undergone clinical validation**
- **Is not intended to diagnose disease**
- **Does not autonomously determine treatment**
- **Does not independently select implants**        
- **Does not replace professional medical judgment**
- **Does not provide validated fracture-risk prediction**        
- **Does not provide validated surgical-outcome prediction**
- **Does not provide validated surgical-outcome prediction**
- **Does not provide autonomous surgical recommendations**

The current AI component is an explainable rule-based assessment engine.

## 🔮 Future Scope

Future development may include:

- **Clinician-reviewed and larger clinical datasets**
- **Clinical validation**
- **Validated machine-learning models**
- **Additional anatomical structures**
- **Additional biomarkers and clinical parameters**
- **Broader imaging integration**
- **Evidence-backed knowledge retrieval**
- **Expanded clinical workflow integration**
- **Multi-centre evaluation**
- **Regulatory assessment where applicable**

The long-term goal is to evolve the prototype from a femur-focused workflow toward a broader multimodal clinical decision-support platform.

## 🌍 Potential Applications
**Orthopaedic Workflows:**
Digital pre-operative case review, anatomical visualisation, and structured planning documentation.

**Clinical Review:**
Bringing anatomical and physiological information together within a single case workflow.

**Medical Education:**
Interactive 3D anatomy with clinically contextualised biomarker information.

**Research:**
A foundation for future anatomy–biomarker analysis and multimodal clinical AI research.

## 🔬 Research Foundation :

The prototype is informed by published literature and clinical guidance related to endocrine and metabolic factors relevant to bone health.

**Key References:**

1.Bilezikian JP et al. Evaluation and Management of Primary Hyperparathyroidism: Summary Statement and Guidelines from the Fifth International Workshop. Journal of Bone and Mineral Research, 2022.

2.Demay MB et al. Vitamin D for the Prevention of Disease: An Endocrine Society Clinical Practice Guideline. Journal of Clinical Endocrinology & Metabolism, 2024.

3.KDIGO. 2017 Clinical Practice Guideline Update for CKD-MBD. Kidney International Supplements, 2017.

4.Holick MF. Vitamin D Deficiency. New England Journal of Medicine, 2007.

5.Siller AF, Whyte MP. Alkaline Phosphatase: Discovery and Naming of Our Favorite Enzyme. Journal of Bone and Mineral Research, 2018.

6.Uday S, Högler W. Osteomalacia and Vitamin D Status: A Clinical Update 2020. JBMR Plus, 2021.

## 🔒 Clinical Notice
This application is a research and innovation prototype developed for demonstration, education, and decision-support workflow exploration.

It has not undergone clinical validation and is not intended for diagnosis, treatment decisions, autonomous surgical planning, implant selection, or replacement of professional medical judgment.

## 👥 Team – ALIKE CODERS
**Team Leader: Sristika Bhattacharyya**

**Second Member: Haimanti De**

**Third Member: Minhaj Gani Khan**

**Fourth Member: Kunal Yadav**

**Fifth Member: Sankha Subhra Hazra**

**Sixth Member: Shayan Datta**
