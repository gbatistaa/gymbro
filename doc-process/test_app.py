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


def test_extract_returns_422_for_invalid_pdf(monkeypatch):
    from docling.exceptions import ConversionError

    monkeypatch.setenv("PARSER_TOKEN", "secret")

    def fail(_):
        raise ConversionError("not a pdf")

    monkeypatch.setattr(app, "convert_pdf_bytes_to_markdown", fail)
    response = TestClient(app.app).post(
        "/extract",
        headers={"X-Parser-Token": "secret"},
        files={"file": ("inbody.pdf", b"not a pdf", "application/pdf")},
    )
    assert response.status_code == 422


def test_extract_returns_502_when_extraction_fails(monkeypatch):
    import requests

    monkeypatch.setenv("PARSER_TOKEN", "secret")
    monkeypatch.setattr(app, "convert_pdf_bytes_to_markdown", lambda _: b"bioimpedance")

    def fail(_):
        raise requests.RequestException("openrouter down")

    monkeypatch.setattr(app, "extract_bioimpedance", fail)
    response = TestClient(app.app).post(
        "/extract",
        headers={"X-Parser-Token": "secret"},
        files={"file": ("inbody.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert response.status_code == 502


def test_normalize_measured_at_keeps_the_report_date():
    date_only = app.normalize_extraction({"measuredAt": "2026-10-01"})
    naive = app.normalize_extraction({"measuredAt": "2026-10-01T08:00:00"})
    with_offset = app.normalize_extraction({"measuredAt": "2026-10-01T08:00:00Z"})
    missing = app.normalize_extraction({})
    unreadable = app.normalize_extraction({"measuredAt": "01/10/2026"})

    assert date_only["measuredAt"] == "2026-10-01"
    assert naive["measuredAt"] == "2026-10-01T08:00:00"
    assert with_offset["measuredAt"] == "2026-10-01T08:00:00Z"
    assert missing["measuredAt"] is None
    assert unreadable["measuredAt"] is None
    assert "measuredAt" in unreadable["missingFields"]


def test_normalize_numbers_written_as_text():
    result = app.normalize_extraction({
        "bodyWeightKg": "82,4 kg",
        "bodyFatPercentage": "18.2",
        "visceralFat": 8,
        "waterPercentage": "não informado",
    })

    assert result["bodyWeightKg"] == 82.4
    assert result["bodyFatPercentage"] == 18.2
    assert result["visceralFat"] == 8.0
    assert result["waterPercentage"] is None
    assert "waterPercentage" in result["missingFields"]


def test_health_is_public_and_light(monkeypatch):
    monkeypatch.setenv("PARSER_TOKEN", "secret")

    response = TestClient(app.app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_pdf_to_markdown_requires_the_parser_token(monkeypatch):
    monkeypatch.setenv("PARSER_TOKEN", "secret")

    def must_not_run(*_):
        raise AssertionError("conversion must not run without a valid token")

    monkeypatch.setattr(app, "convert_and_save_pdf_bytes", must_not_run)
    response = TestClient(app.app).post(
        "/pdf-to-markdown",
        files={"file": ("inbody.pdf", b"%PDF-1.4", "application/pdf")},
    )

    assert response.status_code == 401


def test_interactive_docs_can_be_turned_off(monkeypatch):
    import importlib

    monkeypatch.setenv("PARSER_DOCS_ENABLED", "false")
    hidden = importlib.reload(app)
    try:
        client = TestClient(hidden.app)
        assert client.get("/docs").status_code == 404
        assert client.get("/openapi.json").status_code == 404
    finally:
        monkeypatch.delenv("PARSER_DOCS_ENABLED")
        importlib.reload(app)


def test_interactive_docs_stay_on_by_default(monkeypatch):
    monkeypatch.delenv("PARSER_DOCS_ENABLED", raising=False)

    assert TestClient(app.app).get("/openapi.json").status_code == 200
