# EndoBone AI - Clinical Decision Support Frontend

A modern, clinical-grade React application integrating 3D anatomical models with endocrine and metabolic biomarker profiles for pre-surgical bone health risk assessment.

---

## 🌟 Key Features

- **Multi-Modal Clinical Workspace**: Unifies biochemical lab values, DEXA T-scores, CT-derived bone microarchitecture, and surgical parameters.
- **Interactive 3D Anatomical Planning**: High-fidelity ROI bone model with metabolic risk heatmaps and volumetric microarchitecture metrics.
- **Explainable AI Risk Stratification**: Transparent risk attribution score, clinical insights, and step-by-step recommended pre-operative pathways.
- **Pre-Surgical Action Report**: Operative summary, customizable hardware checklist, and printable clinical briefing.

---

## 📁 Architecture & Folder Structure

```
├── docs/                         # Project & architecture documentation
│   ├── DELIVERABLES.md           # Detailed deliverables and feature inventory
│   ├── SETUP.md                  # Comprehensive setup & deployment guide
│   └── STYLE_GUIDE.md            # Clinical design system & color tokens
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # Reusable UI widgets (e.g. RiskDonut)
│   │   │   ├── layout/               # Global layout (Sidebar, TopBar, WorkflowStepper)
│   │   │   ├── views/                # Clinical workflow views
│   │   │   │   ├── Landing/          # Landing & hero entry
│   │   │   │   ├── Dashboard/        # Case management & metrics
│   │   │   │   ├── MetabolicContext/ # Lab biomarker profiling & trends
│   │   │   │   ├── AIAssessment/     # Explainable AI risk stratification
│   │   │   │   ├── Planning3D/       # 3D bone model & ROI analysis
│   │   │   │   └── PreSurgicalSummary/# Pre-operative action plan
│   │   │   └── EndoBoneAI.jsx        # Main orchestrator component
│   │   ├── data/                     # Mock data & reference databases
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── services/                 # Patient, biomarker, and AI services
│   │   ├── styles/                   # Global Tailwind CSS and clinical styling
│   │   ├── utils/                    # Shared constants and formatting helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/                       # Static assets and 3D models
│   └── index.html                    # Vite HTML entrypoint
├── .eslintrc.cjs                 # ESLint configuration
├── .gitignore                    # Git ignore configuration
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (or 16+)
- npm or yarn

### Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

### Backend API

The Express API runs on port 4000 and requires MongoDB plus a Gemini API key:

```bash
cp .env.example .env
npm run server:dev
```

The Vite development proxy forwards `/api` requests to the backend. Available routes:

- `POST /api/auth/register` with clinician profile and password
- `POST /api/auth/login` with `{ "email": "...", "password": "..." }`
- `POST /api/patients` with `{ "name": "...", "age": 64, "gender": "Female" }`
- `GET /api/patients/:id` returns the patient and assessment history
- `POST /api/assessments/analyze` with a patient ObjectId and five biomarkers
- `PUT /api/assessments/:id/notes` with `planning_notes` and `selected_roi`

Gemini output is constrained to structured JSON and validated before an assessment is saved. This application is clinical decision-support software and does not replace professional medical judgment.

---

## 📚 Documentation

For additional guides and specifications, check the `docs/` folder:
- [Setup & Deployment Guide](docs/SETUP.md)
- [Design System & Style Guide](docs/STYLE_GUIDE.md)
- [Feature Deliverables Inventory](docs/DELIVERABLES.md)

---

## 🔒 Clinical Notice
This application is designed for clinical research and decision-support demonstration. It does not replace professional medical judgment or diagnosis.
