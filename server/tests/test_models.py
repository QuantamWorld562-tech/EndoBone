import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_models():
    response = client.get("/api/models")
    assert response.status_code == 200
    models = response.json()
    assert len(models) == 10
    assert models[0]["model_id"] == "01"
    assert "37_Femur_R" in models[0]["Source"]

def test_get_single_model_and_landmarks():
    response = client.get("/api/models/01")
    assert response.status_code == 200
    model = response.json()
    assert model["model_id"] == "01"
    assert len(model["landmarks_3d"]) == 12
    assert len(model["morphometric_edges"]) == 54

def test_model_morphometric_features():
    response = client.get("/api/models/01/features")
    assert response.status_code == 200
    features = response.json()["features"]
    assert features["edge_count"] == 54
    assert features["mechanical_axis_length_mm"] > 300
