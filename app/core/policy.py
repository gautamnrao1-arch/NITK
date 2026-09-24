"""Deterministic task-policy extraction from the user's original request.

This is intentionally rule-based so the authorization surface is inspectable.
Later: replace with a constrained compiler that still emits a typed policy,
never an LLM-in-the-loop allow/block decision.
"""

from __future__ import annotations

import re

from app.models.schemas import TaskPolicy

DEFAULT_DENIED = [
    "send_email",
    "forward_email",
    "send_file",
    "make_payment",
    "modify_booking",
    "transfer_money",
    "share_calendar",
    "exfiltrate_data",
]

SENSITIVE_SINKS = [
    "recipient",
    "to",
    "email",
    "account",
    "destination_account",
    "path",
    "file",
    "amount",
    "card",
    "webhook",
    "url",
]


def extract_task_policy(user_request: str) -> TaskPolicy:
    text = user_request.lower()
    allowed: list[str] = ["read_page", "read_email", "summarize"]
    goal = "Complete the user's stated task without side-effecting tools."
    constraints = [
        "Only tools in the allow-list may execute.",
        "Denied side-effect tools are never authorized from this task.",
        "Untrusted external values may not flow into sensitive sinks.",
    ]

    if _matches(text, r"flight|fare|ticket|plane|mangalore|delhi|itinerary"):
        goal = "Find and compare flight options for the user."
        allowed = ["search_flights", "compare_prices", "read_page", "summarize"]
        constraints.append("No booking changes, payments, or message forwarding.")
    elif _matches(text, r"email|inbox|mail"):
        goal = "Read and summarize email content for the user."
        allowed = ["read_email", "summarize"]
        constraints.append("Do not send, forward, or attach files.")
    elif _matches(text, r"pay|payment|transfer|upi|rupee|₹"):
        goal = "Inspect a payment-related request; no transfers unless explicitly allowed."
        allowed = ["read_page", "summarize"]
        constraints.append("Payments remain denied unless the user explicitly authorizes them.")
    elif _matches(text, r"search|find|look up|compare"):
        goal = "Search and compare information for the user."
        allowed = ["search_web", "compare_prices", "read_page", "summarize"]

    denied = [t for t in DEFAULT_DENIED if t not in allowed]
    return TaskPolicy(
        user_request=user_request,
        goal=goal,
        allowed_actions=allowed,
        denied_actions=denied,
        sensitive_sinks=SENSITIVE_SINKS,
        constraints=constraints,
    )


def _matches(text: str, pattern: str) -> bool:
    return re.search(pattern, text, flags=re.IGNORECASE) is not None
