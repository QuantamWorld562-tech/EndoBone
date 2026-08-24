import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import db_manager
from app.routes import (
    auth,
    admin,
    cases,
    biomarkers,
    models,
    assessment,
    simulation,
    health
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[SERVER] Starting EndoBone-AI FastAPI server...")
    await db_manager.connect_to_database()
    yield
    # Shutdown
    print("[SERVER] Shutting down EndoBone-AI FastAPI server...")
    await db_manager.close_database_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Unified platform linking 3D CT bone anatomy with endocrine and metabolic biochemical parameters for integrated orthopedic assessment.",
    lifespan=lifespan
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Restricted to known origins. Wildcard "*" is intentionally removed.
# Add production/preview URLs to settings.CORS_ORIGINS via the .env file.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Routers — all mounted under /api prefix only ──────────────────────────────
# Duplicate root-level mounts have been removed (C-6 fix).
# The old root-mounted /assess and /health routes are no longer needed because
# the frontend uses /api/assessments/analyze exclusively.
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(cases.router, prefix=settings.API_V1_STR)
app.include_router(biomarkers.router, prefix=settings.API_V1_STR)
app.include_router(models.router, prefix=settings.API_V1_STR)
app.include_router(assessment.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix=settings.API_V1_STR)

# Mount 3D bone storage if available
storage_dir = settings.STORAGE_DIR
os.makedirs(storage_dir, exist_ok=True)
app.mount("/storage/bones", StaticFiles(directory=storage_dir), name="bones")

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": "/api/health",
        "description": "EndoBone-AI 3D CT & Biomarker Synthesis Gateway"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
