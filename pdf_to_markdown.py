from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from openrouter_test import analyze_markdown, build_prompt

PROMPT = build_prompt()

_converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=PdfPipelineOptions(do_ocr=False)
        )
    }
)

def convert_pdf_to_markdown(source="file.pdf", dest="file.md") -> bytes:
    result = _converter.convert(source)
    md_bytes = result.document.export_to_markdown().encode("utf-8")
    with open(dest, "wb") as f:
        f.write(md_bytes)
    return md_bytes

def convert_pdf_bytes_to_markdown(pdf_bytes: bytes) -> bytes:
    import tempfile, os

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name
    try:
        result = _converter.convert(tmp_path)
        return result.document.export_to_markdown().encode("utf-8")
    finally:
        os.unlink(tmp_path)


def convert_and_save_pdf_bytes(pdf_bytes: bytes, filename: str = "doc.pdf") -> tuple[bytes, str]:
    from pathlib import Path

    md_bytes = convert_pdf_bytes_to_markdown(pdf_bytes)
    md_path = (Path(filename).stem or "doc") + ".md"
    Path(md_path).write_bytes(md_bytes)
    return md_bytes, md_path

if __name__ == "__main__":
		md = convert_pdf_to_markdown()
		print(analyze_markdown(md, PROMPT))