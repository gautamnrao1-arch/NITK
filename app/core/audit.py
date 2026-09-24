"""In-memory audit log. Replace with PostgreSQL without changing the event schema."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.models.schemas import (
    AuditEvent,
    CheckResult,
    Decision,
    Mode,
    TaskPolicy,
)

_EVENTS: list[AuditEvent] = []


def record(
    *,
    scenario_id: str,
    scenario_title: str,
    mode: Mode,
    user_request: str,
    proposed_tool: str,
    decision: Decision,
    executed: bool,
    reason: str,
    policy: TaskPolicy,
    checks: list[CheckResult],
) -> AuditEvent:
    event = AuditEvent(
        id=str(uuid.uuid4())[:8],
        timestamp=datetime.now(timezone.utc),
        scenario_id=scenario_id,
        scenario_title=scenario_title,
        mode=mode,
        user_request=user_request,
        proposed_tool=proposed_tool,
        decision=decision,
        executed=executed,
        reason=reason,
        policy=policy,
        checks=checks,
    )
    _EVENTS.insert(0, event)
    return event


def list_events(limit: int = 50) -> list[AuditEvent]:
    return _EVENTS[:limit]


def clear() -> None:
    _EVENTS.clear()
