import json, os, requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY", "")
MODEL = "google/gemma-4-31b-it"

BIOIMPEDANCE_FIELDS = (
    "measuredAt", "bodyWeightKg", "heightCm", "bodyFatPercentage",
    "muscleMassKg", "skeletalMuscleMassKg", "visceralFat", "waterPercentage",
)


VOGAIS = set("aeiouáàâãéèêíïóôõöúüAEIOUÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜ")


def analyze_markdown(md_bytes: bytes, prompt: str) -> dict:
    md_text = md_bytes.decode("utf-8")
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": MODEL,
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": md_text},
            ],
            "response_format": {"type": "json_object"},
        },
        timeout=120,
    )
    response.raise_for_status()
    idioma = json.loads(response.json()["choices"][0]["message"]["content"]).get("idioma")
    return {
        "quantidade_palavras": len(md_text.split()),
        "letras_vogais": sum(1 for c in md_text if c in VOGAIS),
        "tamanho_bytes": len(md_bytes),
        "idioma": idioma,
    }


def extract_bioimpedance(md_bytes: bytes) -> dict:
    prompt = (
        "Extraia os dados de bioimpedância do documento e retorne SOMENTE JSON. "
        "Use exatamente estas chaves: "
        + json.dumps((*BIOIMPEDANCE_FIELDS, "missingFields"))
        + ". Valores não identificados devem ser null. "
        "missingFields deve listar as chaves cujo valor é null. "
        "measuredAt deve estar em ISO-8601 UTC (ex.: 2026-10-01T00:00:00Z)."
    )
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        json={
            "model": MODEL,
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": md_bytes.decode("utf-8")},
            ],
            "reasoning": {"enabled": True},
            "provider": {"only": ["CoreWeave"]},
            "max_tokens": 4096,
            "response_format": {"type": "json_object"},
        },
        timeout=120,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return json.loads(content)


def build_prompt(fields=("idioma",)) -> str:
    keys = ", ".join(f'"{f}"' for f in fields)
    return (
        "Analise o markdown recebido e retorne SOMENTE um JSON exato "
        f"com as chaves: {{{keys}}}. Sem texto extra."
    )
