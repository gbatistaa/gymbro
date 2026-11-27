import hmac
import os
import re

import requests
from docling.exceptions import ConversionError
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from openrouter_test import BIOIMPEDANCE_FIELDS, analyze_markdown, extract_bioimpedance
from pdf_to_markdown import PROMPT, convert_and_save_pdf_bytes, convert_pdf_bytes_to_markdown

def docs_enabled() -> bool:
    """Interactive docs (/docs, /redoc, /openapi.json) stay on locally; turn them off when public."""
    return os.getenv("PARSER_DOCS_ENABLED", "true").strip().lower() not in {"false", "0", "no"}


_DOCS = docs_enabled()
app = FastAPI(
    docs_url="/docs" if _DOCS else None,
    redoc_url="/redoc" if _DOCS else None,
    openapi_url="/openapi.json" if _DOCS else None,
)


def require_parser_token(
    parser_token: str | None = Header(default=None, alias="X-Parser-Token"),
) -> None:
    """With PARSER_TOKEN set, every conversion route needs the same value in X-Parser-Token."""
    expected_token = os.getenv("PARSER_TOKEN", "")
    if expected_token and not hmac.compare_digest(parser_token or "", expected_token):
        raise HTTPException(status_code=401, detail="invalid parser token")


@app.get("/health")
def health() -> dict:
    """Liveness for the container health check; no token and no model work."""
    return {"status": "ok"}


def normalize_extraction(result: dict) -> dict:
    if not isinstance(result, dict):
        raise ValueError("parser response must be an object")
    normalized = {field: result.get(field) for field in BIOIMPEDANCE_FIELDS}
    for field, value in normalized.items():
        if value is not None and not isinstance(value, (int, float, str)):
            raise ValueError(f"invalid value for {field}")
    for field in NUMERIC_FIELDS:
        normalized[field] = normalize_number(normalized[field])
    normalized["measuredAt"] = normalize_measured_at(normalized["measuredAt"])
    normalized["missingFields"] = [
        field for field in BIOIMPEDANCE_FIELDS if normalized[field] is None
    ]
    return normalized


NUMERIC_FIELDS = tuple(field for field in BIOIMPEDANCE_FIELDS if field != "measuredAt")
NUMBER = re.compile(r"-?\d+(?:[.,]\d+)?")


def normalize_number(value):
    """Numbers sometimes come back as text ("82,4 kg"); unreadable values become None."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        match = NUMBER.search(value)
        return float(match.group().replace(",", ".")) if match else None
    return None


DATE_ONLY = re.compile(r"\d{4}-\d{2}-\d{2}")
DATE_TIME = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?")


def normalize_measured_at(value):
    """Keeps the date as printed in the report, without inventing a time zone.

    Reports rarely state an offset, so a date-only or naive value is returned as is and the
    client resolves it in the user's time zone. Anything that is not ISO-8601 becomes None,
    which lists the field as missing for the user to fill in.
    """
    if not isinstance(value, str):
        return None
    text = value.strip()
    if DATE_ONLY.fullmatch(text) or DATE_TIME.fullmatch(text):
        return text
    return None

@app.post("/pdf-to-markdown", dependencies=[Depends(require_parser_token)])
async def pdf_to_markdown(file: UploadFile = File(...)):
    md_bytes, md_path = convert_and_save_pdf_bytes(await file.read(), file.filename or "doc.pdf")
    result = analyze_markdown(md_bytes, PROMPT)
    result["markdown_file"] = md_path
    return JSONResponse(result)


@app.post("/extract", dependencies=[Depends(require_parser_token)])
async def extract(file: UploadFile = File(...)):
    try:
        markdown = convert_pdf_bytes_to_markdown(await file.read())
    except ConversionError as error:
        raise HTTPException(status_code=422, detail="invalid PDF file") from error

    try:
        return normalize_extraction(extract_bioimpedance(markdown))
    except (requests.RequestException, ValueError, KeyError, TypeError) as error:
        raise HTTPException(status_code=502, detail="extraction failed") from error
