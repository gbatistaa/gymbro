from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

from openrouter_test import analyze_markdown
from pdf_to_markdown import PROMPT, convert_and_save_pdf_bytes

app = FastAPI()


@app.post("/pdf-to-markdown")
async def pdf_to_markdown(file: UploadFile = File(...)):
    md_bytes, md_path = convert_and_save_pdf_bytes(await file.read(), file.filename or "doc.pdf")
    result = analyze_markdown(md_bytes, PROMPT)
    result["markdown_file"] = md_path
    return JSONResponse(result)
