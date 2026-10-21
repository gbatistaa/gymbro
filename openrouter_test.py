import json, os, requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY", "")
MODEL = "nvidia/nemotron-3.5-lightning:free"


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


def build_prompt(fields=("idioma",)) -> str:
    keys = ", ".join(f'"{f}"' for f in fields)
    return (
        "Analise o markdown recebido e retorne SOMENTE um JSON exato "
        f"com as chaves: {{{keys}}}. Sem texto extra."
    )
