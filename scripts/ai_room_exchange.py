#!/usr/bin/env python3
"""Bounded, tool-free exchange between two local model roles."""
import json
import os
import re
import time
import urllib.request
import uuid

API = "https://api.github.com"
TOKEN = os.environ["GITHUB_TOKEN"]
REPO = os.environ["GITHUB_REPOSITORY"]
ISSUE = os.environ["ISSUE_NUMBER"]
EVENT_COMMENT_ID = os.environ["EVENT_COMMENT_ID"]
OLLAMA = os.environ.get("OLLAMA_URL", "http://localhost:11434")
MARKER_PREFIX = "<!-- AI-ROOM-AUTO source-comment:"
MAX_PAGES = 10
MAX_INITIAL_CHARS = 2000
MAX_TURNS = 10
MAX_REPLY_CHARS = 1200


def http_json(url, payload=None, method=None):
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(
        url, data=data, method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {TOKEN}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        raw = response.read()
        return json.loads(raw) if raw else {}


def already_processed():
    for page in range(1, MAX_PAGES + 1):
        url = f"{API}/repos/{REPO}/issues/{ISSUE}/comments?per_page=100&page={page}"
        comments = http_json(url, method="GET")
        if not isinstance(comments, list):
            raise RuntimeError("GitHub comments response was not a list")
        marker = f"{MARKER_PREFIX}{EVENT_COMMENT_ID} -->"
        if any(marker in (item.get("body") or "") for item in comments):
            return True
        if len(comments) < 100:
            return False
    raise RuntimeError("Issue comment ledger exceeds safe pagination limit")


def generate(model, agent_name, other_name, previous_message, turn):
    system = (
        f"Você é {agent_name}. O outro agente é {other_name}. "
        "Você é um modelo local em um teste. Responda em português do Brasil. "
        "Responda SOMENTE ao conteúdo da mensagem anterior. "
        "NÃO copie frases da mensagem anterior. NÃO invente fatos pessoais, nomes, endereços, "
        "credenciais ou informações que não estejam na mensagem anterior. "
        "Se a mensagem anterior não contém uma pergunta clara, faça uma observação curta "
        "sobre o objetivo do teste. Não diga que executou ações. Você não tem ferramentas. "
        "Não alegue ser ChatGPT, GPT-6, Claude ou humano. Máximo 60 palavras."
    )
    prompt = (
        f"Turno {turn}/{MAX_TURNS}.\n"
        f"AGENTE ANTERIOR ({other_name}) DISSE:\n"
        f"---\n{previous_message}\n---\n"
        "Agora responda diretamente. Não repita o texto anterior."
    )
    result = http_json(
        f"{OLLAMA}/api/generate",
        {
            "model": model,
            "system": system,
            "prompt": prompt,
            "stream": False,
            "keep_alive": 0,
            "options": {"temperature": 0.1, "num_predict": 96},
        },
        "POST",
    )
    answer = (result.get("response") or "").strip()
    if not answer:
        raise RuntimeError(f"{agent_name} returned an empty response")
    if len(answer) > MAX_REPLY_CHARS:
        answer = answer[:MAX_REPLY_CHARS].rsplit(" ", 1)[0] + "…"
    return answer.replace("@", "@\u200b")


def publish(agent, model, body, message_id, reply_to, turn):
    comment = (
        f"{MARKER_PREFIX}{EVENT_COMMENT_ID} -->\n"
        f"### {agent} — modelo local: {model}\n"
        f"turn: {turn}/{MAX_TURNS}\n"
        f"message_id: {message_id}\n"
        f"reply_to: {reply_to}\n\n"
        f"{body}\n\n"
        "_Teste experimental: identidade do agente/modelo local, não uma sessão ChatGPT._"
    )
    http_json(f"{API}/repos/{REPO}/issues/{ISSUE}/comments", {"body": comment}, "POST")


def main():
    if not re.fullmatch(r"[0-9]+", EVENT_COMMENT_ID):
        raise RuntimeError("Missing or invalid source comment ID")
    if already_processed():
        print(f"EXCHANGE_SKIPPED: source comment {EVENT_COMMENT_ID} already processed.")
        return

    initial = os.environ["INITIAL_MESSAGE"].strip()
    prefix = "/ai-room start "
    if not initial.startswith(prefix):
        raise RuntimeError("Initial message does not match the authorized command")
    initial = initial[len(prefix):].strip()
    if len(initial) > MAX_INITIAL_CHARS:
        raise RuntimeError(f"Initial message exceeds {MAX_INITIAL_CHARS} characters")
    if not initial:
        initial = "Definam como validar uma conversa real entre dois modelos locais."

    previous = initial
    previous_message_id = f"USER-{EVENT_COMMENT_ID}"
    agents = [
        ("Agent-A", "qwen2.5:1.5b", "Agent-B"),
        ("Agent-B", "smollm2:1.7b", "Agent-A"),
    ]

    for turn in range(1, MAX_TURNS + 1):
        agent, model, other = agents[(turn - 1) % 2]
        answer = generate(model, agent, other, previous, turn)
        message_id = str(uuid.uuid4())
        publish(agent, model, answer, message_id, previous_message_id, turn)
        previous = answer
        previous_message_id = message_id
        time.sleep(2)

    print(f"EXCHANGE_COMPLETE: {MAX_TURNS} generated turns posted by one GitHub Actions run.")


if __name__ == "__main__":
    main()
