import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_cases():
    response = client.get("/api/cases")
    assert response.status_code == 200
    data = response.json()
    assert "cases" in data
    assert isinstance(data["cases"], list)

def test_create_case():
    new_case = {
        "case_id": "TEST-CASE-999",
        "model_id": "01",
        "patient_name": "Test Patient",
        "patient_age": 62,
        "patient_gender": "Female",
        "clinical_indication": "Evaluation for total hip arthroplasty"
    }
    response = client.post("/api/cases", json=new_case)
    assert response.status_code == 201
    data = response.json()
    assert data["case_id"] == "TEST-CASE-999"
    assert data["model_id"] == "01"

def test_create_case_flexible_and_get_full():
    # Test flexible frontend case creation payload
    payload = {
        "name": "Alex Mercer",
        "age": 64,
        "gender": "Other",
        "procedure": "Total Knee Arthroplasty (TKA)",
        "pth": 74.2,
        "vitaminD": 22.0,
        "calcium": 9.2,
        "phosphate": 3.1,
        "alp": 115.0,
        "ctx": 390.0
    }
    response = client.post("/api/cases", json=payload)
    assert response.status_code == 201
    created = response.json()
    assert "case_id" in created
    case_id = created["case_id"]

    # Test full case retrieval with generated AI assessment, ROIs, and simulation
    full_resp = client.get(f"/api/cases/{case_id}/full")
    assert full_resp.status_code == 200
    full_data = full_resp.json()
    assert full_data["case_id"] == case_id
    assert full_data["patient_gender"] == "Other"
    assert full_data["model"] is not None
    assert full_data["biomarker"] is not None
    assert full_data["assessment"] is not None
    assert len(full_data["roi"]) > 0
    assert full_data["simulation"] is not None

def test_delete_case():
    # Create a temporary case
    payload = {
        "name": "Delete Me",
        "age": 55,
        "gender": "Male",
        "procedure": "Total Hip Arthroplasty (THA)"
    }
    create_resp = client.post("/api/cases", json=payload)
    assert create_resp.status_code == 201
    case_id = create_resp.json()["case_id"]

    # Delete case
    del_resp = client.delete(f"/api/cases/{case_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["message"] == "Case deleted successfully"
