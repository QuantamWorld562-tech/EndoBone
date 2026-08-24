# EndoBone AI - Clinical Workflow & Architecture Guide

This document outlines the full end-to-end user workflow, application routing, and state management within the EndoBone AI platform.

## 1. Application Entry & Authentication

### Landing Page (`LandingView.jsx`)
- The initial entry point for the application.
- Presents the platform's value proposition.
- Contains direct links to **Login**, **Register**, and a **View Demo** button that bypasses authentication using a demo patient (`PEB-8842-A`).

### Authentication (`LoginView.jsx` / `RegisterView.jsx`)
- Clinicians log in or create an account.
- Authenticated state is managed via JWT tokens and stored in local storage/cookies.
- Upon successful authentication, the user is redirected to the **Dashboard**.

---

## 2. Patient Management

### Dashboard (`DashboardView.jsx`)
- Serves as the central hub for clinicians.
- Displays a list of all active and pending patient cases.
- Provides search and filtering capabilities.
- **Action**: Selecting a patient card updates the global `activePatientId` in the `PatientDataContext` and routes the user to the first step of the clinical workflow: **Metabolic Context**.

---

## 3. Clinical Assessment Workflow

The core functionality of EndoBone AI is guided by a stepper (`WorkflowStepper.jsx`) that walks the clinician through four key phases:

### Step 1: Endocrine & Metabolic Context (`MetabolicContextView.jsx`)
- **Purpose**: Input and review the patient's recent lab results and endocrine biomarker profile.
- **Key Biomarkers**: PTH, 25-OH Vitamin D, Total Calcium, Total Phosphate, ALP, CTX-I, etc.
- **Action**: When the user clicks "Run AI Assessment", the frontend sends the biomarker data to the FastAPI backend (or uses the local rule engine fallback) to calculate the patient's risk profile.

### Step 2: AI Risk Assessment (`AIAssessmentView.jsx`)
- **Purpose**: Display the results of the clinical decision reasoning engine.
- **Components**:
  - **Risk Score & Stratification**: Shows an overall risk level (e.g., Critical, High, Moderate, Low).
  - **Clinical Reasoning**: Explains *why* the risk level was assigned based on the specific combination of biomarkers and DEXA/CT scores.
  - **Endocrine Trends**: Visualizes longitudinal biomarker data using smooth Catmull-Rom splines (`EndocrineTrendChart.jsx`).

### Step 3: 3D Anatomical Planning (`Planning3DView.jsx`)
- **Purpose**: High-fidelity 3D visualization and pre-surgical anatomical inspection.
- **Components**:
  - **Interactive 3D Model** (`BoneModelViewer.jsx`): Renders a femur/hip model using Three.js (`@react-three/fiber`).
  - **Risk Heatmap**: Overlays metabolic risk zones directly onto the 3D geometry.
  - **Dynamic Annotations**: Hovering over anatomical regions displays attached popup badges and leader lines to explain specific structural risks.
  - **Clinical Panels**: A tabbed interface allowing the clinician to toggle between the **Lab Panel**, **Endocrine Trends**, and **Anatomy & Notes** (for adding custom pre-operative observations).

### Step 4: Pre-Surgical Summary (`PreSurgicalSummaryView.jsx`)
- **Purpose**: Consolidate all findings into a final, actionable report.
- **Components**:
  - Summarizes the AI risk assessment, biomarker abnormalities, and 3D anatomical insights.
  - **Hardware Checklist**: An interactive checklist for planning surgical equipment (e.g., specific screws, plates, cement augmentation) based on the patient's bone quality.
  - **Export**: Generates a clean, printable briefing for the operating room.

---

## 4. State Management & Data Flow

### Global Context (`PatientDataContext.jsx`)
- **State Hub**: Wraps the main application and acts as the single source of truth for patient data, current workflow state, and AI assessment results.
- **URL Synchronization**: The `TopBar.jsx` component listens to URL parameters (`/:patientId/*`) and ensures the `PatientDataContext` is always synchronized with the URL. If a user navigates directly to `/patients/PEB-8841-B/planning`, the context automatically hydrates with `PEB-8841-B`'s clinical data.

### API & Mock Fallback
- **Backend Communication**: The `biomarkerService.js` and `apiAdapters.js` handle requests to the FastAPI backend.
- **Offline Resilience**: If the backend is unreachable or the user is in demo mode, the application seamlessly falls back to `mockData.js`, which contains comprehensive seed data, historical biomarker records, and a local execution of the clinical decision rules.

---

## 5. Directory Mapping

- `client/src/components/views/` - Contains the primary page components for the workflow phases.
- `client/src/components/common/` - Contains reusable UI widgets (e.g., `EndocrineTrendChart`, `RiskDonut`).
- `client/src/components/layout/` - Contains global wrappers (`TopBar`, `Sidebar`, `WorkflowStepper`).
- `client/src/context/` - Global state providers.
- `client/src/data/` - Local mock databases and fallback logic.
