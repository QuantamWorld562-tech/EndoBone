from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ReferenceRange(BaseModel):
    min: float
    max: float
    unit: str
    description: str

class BiomarkerInput(BaseModel):
    vitamin_d: Optional[float] = Field(None, ge=0, le=300, description="25(OH) Vitamin D in ng/mL")
    pth: Optional[float] = Field(None, ge=0, le=1000, description="Intact Parathyroid Hormone in pg/mL")
    calcium: Optional[float] = Field(None, ge=2, le=25, description="Total Serum Calcium in mg/dL")
    phosphate: Optional[float] = Field(None, ge=0, le=15, description="Serum Inorganic Phosphate in mg/dL")
    alp: Optional[float] = Field(None, ge=0, le=2000, description="Alkaline Phosphatase in U/L")

class BiomarkerCreate(BiomarkerInput):
    case_id: str = Field(..., description="Associated patient case ID or MongoDB ObjectId")

class BiomarkerUpdate(BiomarkerInput):
    case_id: Optional[str] = None

class BiomarkerResponse(BiomarkerInput):
    id: Optional[str] = Field(None, alias="_id")
    case_id: str
    updated_at: Optional[str] = None
    assessment: Optional[Dict[str, Any]] = None
    model_config = ConfigDict(populate_by_name=True, extra="allow")
