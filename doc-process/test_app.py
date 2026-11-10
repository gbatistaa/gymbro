from fastapi.testclient import TestClient

import app


def test_extract_returns_java_contract(monkeypatch):
    monkeypatch.setenv("PARSER_TOKEN", "secret")
    monkeypatch.setattr(app, "convert_pdf_bytes_to_markdown", lambda _: b"bioimpedance")
    monkeypatch.setattr(app, "extract_bioimpedance", lambda _: {
        "measuredAt": "2026-10-01T08:00:00Z",
        "bodyWeightKg": 82.4,
        "skeletalMuscleMassKg": None,
    })

    response = TestClient(app.app).post(
        "/extract",
        headers={"X-Parser-Token": "secret"},
        files={"file": ("inbody.pdf", b"%PDF-1.4", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "measuredAt": "2026-10-01T08:00:00Z",
        "bodyWeightKg": 82.4,
        "heightCm": None,
        "bodyFatPercentage": None,
        "muscleMassKg": None,
        "skeletalMuscleMassKg": None,
        "visceralFat": None,
        "waterPercentage": None,
        "missingFields": [
            "heightCm", "bodyFatPercentage", "muscleMassKg",
            "skeletalMuscleMassKg", "visceralFat", "waterPercentage",
        ],
    }


def test_extract_rejects_invalid_token(monkeypatch):
    monkeypatch.setenv("PARSER_TOKEN", "secret")
    response = TestClient(app.app).post(
        "/extract",
        headers={"X-Parser-Token": "wrong"},
        files={"file": ("inbody.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert response.status_code == 401
