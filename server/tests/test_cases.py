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
