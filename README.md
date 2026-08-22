# EndoBone AI - Clinical Decision Support Platform

A modern, clinical-grade platform integrating 3D anatomical models with endocrine and metabolic biomarker profiles for pre-surgical bone health risk assessment. 

The platform consists of a **React/Vite Frontend** and a **FastAPI/Python Backend**.

---
Frontend-https://endo-bone.vercel.app     
Backend-https://endobone.onrender.com
## 🌟 Key Features

- **Multi-Modal Clinical Workspace**: Unifies biochemical lab values, DEXA T-scores, CT-derived bone microarchitecture, and surgical parameters.
- **Interactive 3D Anatomical Planning**: High-fidelity ROI bone model with metabolic risk heatmaps and volumetric microarchitecture metrics.
- **Explainable AI Risk Stratification**: Transparent risk attribution score, clinical insights, and step-by-step recommended pre-operative pathways using a custom rule engine.
- **Pre-Surgical Action Report**: Operative summary, customizable hardware checklist, and printable clinical briefing.

---

## 📁 Architecture & Folder Structure

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

## 🔒 Clinical Notice
This application is designed for clinical research and decision-support demonstration. It does not replace professional medical judgment or diagnosis.
