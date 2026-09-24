from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Provenance(str, Enum):
    USER = "user"
    EXTERNAL = "external"
    SYSTEM = "system"


class Decision(str, Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    ASK = "ASK"


class Mode(str, Enum):
    UNPROTECTED = "unprotected"
    INTENTLOCK = "intentlock"


class LabeledValue(BaseModel):
    value: Any
    provenance: Provenance
    source: str


class ToolCall(BaseModel):
    name: str
    arguments: dict[str, LabeledValue]


class TaskPolicy(BaseModel):
    user_request: str
    goal: str
    allowed_actions: list[str]
    denied_actions: list[str]
    sensitive_sinks: list[str]
    constraints: list[str]


class CheckResult(BaseModel):
    rule: str
    passed: bool
    detail: str


class EnforcementResult(BaseModel):
    decision: Decision
    reason: str
    violated_rules: list[str] = Field(default_factory=list)
    checks: list[CheckResult] = Field(default_factory=list)


class Scenario(BaseModel):
    id: str
    title: str
    language: str
    content_kind: str
    user_request: str
    external_content: str
    external_source: str
    agent_thought: str
    proposed_action: ToolCall
    notes: str


class ProposedAction(BaseModel):
    name: str
    pretty: str
    arguments: dict[str, LabeledValue]


class RunRequest(BaseModel):
    scenario_id: str
    mode: Mode = Mode.INTENTLOCK


class AuditEvent(BaseModel):
    id: str
    timestamp: datetime
    scenario_id: str
    scenario_title: str
    mode: Mode
    user_request: str
    proposed_tool: str
    decision: Decision
    executed: bool
    reason: str
    policy: TaskPolicy
    checks: list[CheckResult]


class RunResponse(BaseModel):
    scenario: Scenario
    policy: TaskPolicy
    proposed: ProposedAction
    enforcement: EnforcementResult
    executed: bool
    execution_note: str
    audit: AuditEvent
    flow: list[str]
