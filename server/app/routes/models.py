import os
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.schemas.model_schema import FemurModelResponse
from app.services.model_service import ModelService
from app.ai.feature_engineering import MorphometricFeatureEngineering
from app.core.config import settings

router = APIRouter(prefix="/models", tags=["3D Bone Models & CT Morphometry"])

@router.get("", response_model=List[FemurModelResponse])
async def list_models():
    return ModelService.get_all_models()

@router.get("/{model_id}", response_model=FemurModelResponse)
async def get_model(model_id: str):
    model = ModelService.get_model_by_id(model_id)
    if not model:
        raise HTTPException(status_code=404, detail=f"3D Femur model '{model_id}' not found")
    return model

@router.get("/{model_id}/features")
async def get_model_morphometric_features(model_id: str):
    model = ModelService.get_model_by_id(model_id)
    if not model:
        raise HTTPException(status_code=404, detail=f"3D Femur model '{model_id}' not found")
    features = MorphometricFeatureEngineering.compute_graph_features(
        landmarks=model.get("raw_landmarks", {}),
        edges=model.get("morphometric_edges", [])
    )
    return {"model_id": model_id, "features": features}

@router.get("/{model_id}/download")
async def download_glb_model(model_id: str):
    model = ModelService.get_model_by_id(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    storage_dir = settings.STORAGE_DIR
    candidate_names = [
        f"{model['Source']}.glb",
        f"{model['Source']}",
        f"{model_id}.glb",
        f"{model_id.zfill(2)}.glb"
    ]

    for c in candidate_names:
        p = os.path.join(storage_dir, c)
        if os.path.isfile(p):
            return FileResponse(p, media_type="model/gltf-binary", filename=f"{model['Source']}.glb")

    # Check root /model folder fallback
    base_model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "model")
    for c in candidate_names:
        p = os.path.join(base_model_dir, c)
        if os.path.isfile(p):
            return FileResponse(p, media_type="model/gltf-binary", filename=f"{model['Source']}.glb")

    raise HTTPException(status_code=404, detail="3D binary GLB file not found on disk")
