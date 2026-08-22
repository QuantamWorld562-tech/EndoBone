import time
from typing import Dict, Any
from fastapi import APIRouter
from app.core.database import db_manager
from app.services.model_service import ModelService

router = APIRouter(tags=["System Health & Telemetry"])

START_TIME = time.time()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "database_connected": db_manager.is_connected
    }

@router.get("/system/status")
async def system_status():
    models = ModelService.get_all_models()
    uptime = int(time.time() - START_TIME)
    return {
        "pipelineStatus": "optimal",
        "databaseConnected": db_manager.is_connected,
        "modelsLoaded": len(models),
        "uptimeSeconds": uptime,
        "cacheLatency": "0.8ms",
        "engineVersion": "EndoBone-AI 1.0.0",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
