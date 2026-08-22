# EndoBone-AI Backend

A high-performance FastAPI/Python backend for **EndoBone-AI**, linking 3D CT patient femur anatomy, 54-edge morphometric graph mesh datasets, and endocrine/metabolic biochemical rule engines (Models 4, 5, and 6) for pre-surgical orthopedic evaluation.

---

## 🏛️ Architecture Overview

```text
EndoBone-AI/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entrypoint, middleware, router mount
│   │   ├── core/
│   │   │   ├── config.py              # Pydantic BaseSettings environment config
│   │   │   └── database.py            # Async Motor MongoDB client & resilient fallback
│   │   ├── schemas/
│   │   │   ├── case_schema.py         # Patient case Pydantic schemas
│   │   │   ├── biomarker_schema.py    # Biomarker & reference range schemas
│   │   │   ├── model_schema.py        # 3D anatomical landmarks & 54-edge mesh schemas
│   │   │   ├── assessment_schema.py   # Multi-biomarker rule engine output schemas
│   │   │   └── simulation_schema.py   # Biomechanical load & Gemini AI synthesis schemas
│   │   ├── routes/
│   │   │   ├── cases.py               # Case CRUD (/api/cases)
│   │   │   ├── biomarkers.py          # Biomarker CRUD & updates (/api/biomarkers)
│   │   │   ├── models.py              # 3D Models & 54-edge morphometrics (/api/models)
│   │   │   ├── assessment.py          # Clinical rule evaluation (/api/assess)
│   │   │   ├── simulation.py          # Finite element stress simulation & Gemini AI
│   │   │   └── health.py              # Health check & pipeline telemetry
│   │   ├── services/
│   │   │   ├── case_service.py        # Patient case business logic
│   │   │   ├── biomarker_service.py   # Biomarker data layer & rule triggering
│   │   │   ├── model_service.py       # 10 femur CT models, 12 landmarks & 54-edge loader
│   │   │   ├── assessment_service.py  # Model 4, 5, 6 evaluation coordination
│   │   │   └── simulation_service.py  # Biomechanical stress & AI synthesis service
│   │   ├── ai/
│   │   │   ├── biomarker_engine.py    # 10-rule cross-biomarker interaction matrix (R1-R10)
│   │   │   ├── bone_assessment.py     # CT radiomics, volumetric BMD & fracture load algorithms
│   │   │   └── feature_engineering.py # 54-edge graph feature extraction & mechanical axes
│   │   └── utils/
│   │       └── validators.py          # Physiological ranges & ID validators
│   ├── storage/
│   │   └── bones/                     # GLB 3D femur files (01.glb - 10.glb)
│   ├── tests/
│   │   ├── test_cases.py              # Pytest case management suite
│   │   ├── test_biomarkers.py         # Pytest endocrine rule triggers suite
│   │   └── test_models.py             # Pytest 3D landmarks and 54-edge mesh suite
│   ├── .env                           # Environment configuration
│   ├── .gitignore
│   └── requirements.txt               # Dependencies
└── frontend/                          # React + Vite + Three.js + Tailwind UI
```

---

## ⚡ Quick Start

### 1. Installation
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Running the Server
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI Swagger UI is available at `http://localhost:8000/docs`.

### 3. Running Unit Tests
```bash
pytest backend/tests/
```

---

## 🔬 Clinical Rule Engines Supported

- **Model 4 (Contextual Biomarker Evaluation)**: Evaluates 25(OH)D, Intact PTH, Serum Calcium, Phosphate, and ALP against standard clinical reference ranges.
- **Model 5 (Multi-Biomarker Interaction Matrix R1–R10)**: Detects compensatory secondary hyperparathyroidism, osteomalacia patterns, primary hyperparathyroidism profiles, renal osteodystrophy, and isolated high bone turnover.
- **Model 6 (Clinical Explainability Engine)**: Delivers detailed mechanistic pathophysiological rationales for pre-surgical implant fixation and pharmacological optimization.
- **54-Edge Morphometric Graph**: Analyzes 12 3D anatomical landmarks (HIP CENTRE, KNEE CENTRE, EPICONDYLES, CONDYLES, ANTERIOR/POSTERIOR CORTEX) spanning 54 edge lengths for each bone model.
