from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class Coordinate3D(BaseModel):
    X: float
    Y: float
    Z: float

class AnatomicalLandmark(BaseModel):
    id: str
    label: str
    x: float
    y: float
    z: float

class MorphometricEdge(BaseModel):
    edge_id: int
    v1: int
    v2: int
    length_mm: float

class FemurModelBase(BaseModel):
    model_id: str
    Source: str
    case_label: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    bone_side: Optional[str] = None
    anatomical_region: Optional[str] = "Proximal & Diaphyseal Femur"
    ct_slice_thickness_mm: Optional[float] = 0.625
    hounsfield_mean_cortical: Optional[float] = None
    hounsfield_mean_trabecular: Optional[float] = None
    neck_shaft_angle_deg: Optional[float] = None
    anteversion_angle_deg: Optional[float] = None
    femoral_head_diameter_mm: Optional[float] = None
    cortical_thickness_calcar_mm: Optional[float] = None
    cortical_thickness_midshaft_mm: Optional[float] = None
    ma_length: Optional[float] = None
    tea_length: Optional[float] = None
    ap_length: Optional[float] = None
    landmarks_3d: Optional[List[AnatomicalLandmark]] = None
    raw_landmarks: Optional[Dict[str, Coordinate3D]] = None
    morphometric_edges: Optional[List[MorphometricEdge]] = None
    csv_raw_measurements: Optional[Dict[str, Any]] = None
    presurgical_notes: Optional[str] = None

class FemurModelResponse(FemurModelBase):
    glb_download_url: Optional[str] = None
