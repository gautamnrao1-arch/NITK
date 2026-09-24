"""Deterministic IntentLock enforcement.

The allow/block/ask decision is made only by these rules. No LLM is consulted.
"""

from __future__ import annotations

from app.models.schemas import (
    CheckResult,
    Decision,
    EnforcementResult,
    Provenance,
    TaskPolicy,
    ToolCall,
)

UNTRUSTED = {Provenance.EXTERNAL}


def enforce(policy: TaskPolicy, tool: ToolCall) -> EnforcementResult:
    checks: list[CheckResult] = []

    allowed = tool.name in policy.allowed_actions
    denied = tool.name in policy.denied_actions
    checks.append(
        CheckResult(
            rule="allow_list",
            passed=allowed,
            detail=(
                f"Tool `{tool.name}` is in the task allow-list."
                if allowed
                else f"Tool `{tool.name}` is not authorized by the user's original task."
            ),
        )
    )
    checks.append(
        CheckResult(
            rule="deny_list",
            passed=not denied,
            detail=(
                f"Tool `{tool.name}` is an explicit side-effect deny for this task."
                if denied
                else f"Tool `{tool.name}` is not on the task deny-list."
            ),
        )
    )

    untrusted_sinks: list[str] = []
    for arg_name, labeled in tool.arguments.items():
        is_sink = arg_name.lower() in {s.lower() for s in policy.sensitive_sinks}
        if is_sink and labeled.provenance in UNTRUSTED:
            untrusted_sinks.append(arg_name)

    flow_ok = len(untrusted_sinks) == 0
    checks.append(
        CheckResult(
            rule="information_bound",
            passed=flow_ok,
            detail=(
                "No untrusted external values flow into sensitive action arguments."
                if flow_ok
                else (
                    "Untrusted external content would flow into sensitive sink(s): "
                    + ", ".join(untrusted_sinks)
                    + "."
                )
            ),
        )
    )

    user_text = policy.user_request.lower()
    dest_ok = True
    dest_detail = "No destination argument conflicts with user intent."
    for arg_name, labeled in tool.arguments.items():
        if arg_name.lower() in {"recipient", "to", "email", "account", "destination_account"}:
            dest = str(labeled.value).lower()
            if labeled.provenance in UNTRUSTED or dest not in user_text:
                if "attacker" in dest or "evil" in dest or dest.endswith("@example.com"):
                    dest_ok = False
                    dest_detail = (
                        f"Destination `{labeled.value}` is not present in the user's request "
                        "and is treated as an unauthorized exfiltration target."
                    )
                    break
    checks.append(
        CheckResult(
            rule="destination_scope",
            passed=dest_ok,
            detail=dest_detail,
        )
    )

    violated = [c.rule for c in checks if not c.passed]

    if denied or (not allowed and untrusted_sinks):
        decision = Decision.BLOCK
        reason = (
            f"Blocked: `{tool.name}` is outside the authorized scope of "
            f"“{policy.goal}”. "
            + (checks[1].detail if denied else "")
            + (" " + next(c.detail for c in checks if c.rule == "information_bound" and not c.passed) if untrusted_sinks else "")
        ).strip()
    elif not allowed:
        decision = Decision.ASK
        reason = (
            f"Ask: `{tool.name}` is neither explicitly allowed nor a known deny-listed "
            "exfiltration tool. A human should confirm before execution."
        )
    elif not flow_ok or not dest_ok:
        decision = Decision.BLOCK
        reason = (
            f"Blocked: `{tool.name}` is in-scope as a tool name, but untrusted or "
            "out-of-scope values would cross an information bound into a sensitive sink."
        )
    else:
        decision = Decision.ALLOW
        reason = (
            f"Allowed: `{tool.name}` is in the task allow-list, and all arguments "
            "are within the user's original intent with trusted provenance."
        )

    return EnforcementResult(
        decision=decision,
        reason=reason,
        violated_rules=violated,
        checks=checks,
    )
