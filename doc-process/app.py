import hmac
import json
import os

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from openrouter_test import BIOIMPEDANCE_FIELDS, analyze_markdown, extract_bioimpedance
from pdf_to_markdown import PROMPT, convert_and_save_pdf_bytes, convert_pdf_bytes_to_markdown

app = FastAPI()


def normalize_extraction(result: dict) -> dict:
    if not isinstance(result, dict):
        raise ValueError("parser response must be an object")
    normalized = {field: result.get(field) for field in BIOIMPEDANCE_FIELDS}
    for field, value in normalized.items():
        if value is not None and not isinstance(value, (int, float, str)):
            raise ValueError(f"invalid value for {field}")
    normalized["missingFields"] = [
        field for field in BIOIMPEDANCE_FIELDS if normalized[field] is None
    ]
    return normalized

@app.post("/pdf-to-markdown")
async def pdf_to_markdown(file: UploadFile = File(...)):
    md_bytes, md_path = convert_and_save_pdf_bytes(await file.read(), file.filename or "doc.pdf")
    result = analyze_markdown(md_bytes, PROMPT)
    result["markdown_file"] = md_path
    return JSONResponse(result)


@app.post("/extract")
async def extract(
    file: UploadFile = File(...),
    parser_token: str | None = Header(default=None, alias="X-Parser-Token"),
):
    expected_token = os.getenv("PARSER_TOKEN", "")
    if expected_token and not hmac.compare_digest(parser_token or "", expected_token):
        raise HTTPException(status_code=401, detail="invalid parser token")

    try:
        markdown = convert_pdf_bytes_to_markdown(await file.read())
        return normalize_extraction(extract_bioimpedance(markdown))
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=502, detail="invalid parser response") from error
