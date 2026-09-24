from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.agent_sim import load_and_propose, pretty_call
from app.core.audit import list_events, record
from app.core.enforcer import enforce
from app.core.policy import extract_task_policy
from app.data.scenarios import list_scenarios
from app.models.schemas import Decision, Mode, RunRequest, RunResponse

app = FastAPI(
    title="IntentLock",
    description="Provenance-typed, information-bounded action enforcement for AI agents.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "intentlock"}


@app.get("/api/scenarios")
def scenarios():
    return [
        {
            "id": s.id,
            "title": s.title,
            "language": s.language,
            "content_kind": s.content_kind,
            "user_request": s.user_request,
            "notes": s.notes,
        }
        for s in list_scenarios()
    ]


@app.post("/api/run", response_model=RunResponse)
def run(req: RunRequest) -> RunResponse:
    try:
        scenario, tool, proposed = load_and_propose(req.scenario_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown scenario") from exc

    policy = extract_task_policy(scenario.user_request)
    enforcement = enforce(policy, tool)

    if req.mode == Mode.UNPROTECTED:
        executed = True
        execution_note = (
            "UNPROTECTED: the proposed tool would execute with no authorization check. "
            "This path is simulated — no email, file, or payment is actually sent."
        )
        decision = Decision.ALLOW
        reason = (
            "No independent policy layer. The agent’s proposed action is treated as authorized."
        )
        checks = []
    else:
        executed = enforcement.decision == Decision.ALLOW
        decision = enforcement.decision
        reason = enforcement.reason
        checks = enforcement.checks
        if enforcement.decision == Decision.BLOCK:
            execution_note = "INTENTLOCK: action blocked. Simulated side effects were not applied."
        elif enforcement.decision == Decision.ASK:
            execution_note = "INTENTLOCK: execution held pending explicit user confirmation."
        else:
            execution_note = "INTENTLOCK: action allowed. Simulated comparison/search only."

    audit = record(
        scenario_id=scenario.id,
        scenario_title=scenario.title,
        mode=req.mode,
        user_request=scenario.user_request,
        proposed_tool=pretty_call(tool),
        decision=decision,
        executed=executed,
        reason=reason,
        policy=policy,
        checks=checks or enforcement.checks,
    )

    return RunResponse(
        scenario=scenario,
        policy=policy,
        proposed=proposed,
        enforcement=enforcement.model_copy(
            update={"decision": decision, "reason": reason, "checks": audit.checks}
        ),
        executed=executed,
        execution_note=execution_note,
        audit=audit,
        flow=[
            "User Intent",
            "AI Agent",
            "Untrusted Content",
            "Proposed Tool Action",
            "IntentLock" if req.mode == Mode.INTENTLOCK else "No Guard",
            decision.value,
        ],
    )


@app.get("/api/audit")
def audit(limit: int = 40):
    return list_events(limit=limit)


WEB = Path(__file__).resolve().parent / "web"


@app.get("/")
def index():
    return FileResponse(WEB / "index.html")


app.mount("/assets", StaticFiles(directory=WEB), name="assets")
