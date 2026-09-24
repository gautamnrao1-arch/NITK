# IntentLock

Provenance-typed, information-bounded action enforcement for AI agents.

This prototype shows how indirect prompt injection can push an agent toward an unauthorized tool call, and how an independent Python policy layer can still **BLOCK** that call.

The final ALLOW / BLOCK / ASK decision is never made by a language model.

## What it demonstrates

User intent → AI agent → untrusted content → proposed tool action → IntentLock → ALLOW / BLOCK / ASK

Five hard-coded Attack Lab scenarios:

1. Normal page (compare fares — allowed)
2. Malicious webpage (forward email — blocked)
3. Malicious email (send file — blocked)
4. Hinglish attack (forward email — blocked)
5. Kannada-English attack (make payment — blocked)

All tools are simulated. Nothing is emailed, paid, or uploaded.

## Run locally

Python 3.11+ (3.14 is fine). Node is only needed if you want the Vite React app.

### Fastest path (API + Attack Lab UI)

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Attack Lab: http://127.0.0.1:8000
- API docs: http://127.0.0.1:8000/docs

### Optional React + Tailwind frontend

```bash
cd frontend
npm install
npm run dev
```

UI: http://127.0.0.1:5173 — Vite proxies `/api` to FastAPI on port 8000.

## Docker Compose

```bash
docker compose up --build
```

- UI: http://127.0.0.1:8080
- API: http://127.0.0.1:8000

PostgreSQL and Redis are not used in this MVP; the audit log is in-memory. The event schema in `backend/app/core/audit.py` is the swap point later.

## Layout

```
backend/app/core/policy.py      extract a typed task policy from the user request
backend/app/core/enforcer.py    deterministic allow/block/ask
backend/app/core/agent_sim.py   simulated agent (replace with a real LLM later)
backend/app/data/scenarios.py   hard-coded attacks
backend/app/core/audit.py       audit events
frontend/                       Attack Lab UI
```

Later extension points: live Claude/Gemini calls, richer provenance lattices, multilingual classifiers, adaptive red teaming, an MCP gateway, canaries, leak budgets, and noninterference tests. Keep those behind the same `enforce(policy, tool)` boundary.
