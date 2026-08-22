import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_assess_normal_biomarkers():
    payload = {
        "vitamin_d": 45.0,
        "pth": 35.0,
        "calcium": 9.4,
        "phosphate": 3.6,
        "alp": 78.0
    }
    response = client.post("/api/assess", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["individual_assessments"]) == 5
    assert len(data["detected_relationships"]) == 0

def test_assess_secondary_hyperparathyroidism_rule():
    payload = {
        "vitamin_d": 18.0,
        "pth": 88.0,
        "calcium": 8.9,
        "phosphate": 3.1,
        "alp": 110.0
    }
    response = client.post("/api/assess", json=payload)
    assert response.status_code == 200
    data = response.json()
    rule_ids = [r["rule_id"] for r in data["detected_relationships"]]
    assert "R1_VITD_PTH_COMPENSATORY" in rule_ids
