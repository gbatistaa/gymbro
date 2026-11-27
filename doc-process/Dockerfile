# syntax=docker/dockerfile:1
# Motor Python: FastAPI + docling (PDF → markdown) + OpenRouter (markdown → JSON da bioimpedância).

FROM python:3.14.4-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/opt/hf-cache

RUN useradd --system --uid 10001 --home-dir /app --no-create-home app
WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY app.py openrouter_test.py pdf_to_markdown.py ./

# baixa os modelos do docling na imagem: o contêiner sobe pronto e não depende do Hugging Face
RUN python -c "from docling.datamodel.base_models import InputFormat; \
import pdf_to_markdown; \
pdf_to_markdown._converter.initialize_pipeline(InputFormat.PDF)" \
    && chown -R app:app /opt/hf-cache /app

# modelos já estão no cache: nada de download em tempo de execução
ENV HF_HUB_OFFLINE=1
USER app

EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=3s --start-period=60s --retries=4 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)" || exit 1
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
