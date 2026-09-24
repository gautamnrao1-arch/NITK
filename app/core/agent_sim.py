"""Simulated agent: reads untrusted content and emits a proposed tool call.

No live LLM is required for the demo. Swap this module later for a real
model that still must pass through IntentLock before any tool executes.
"""

from __future__ import annotations

from app.data.scenarios import get_scenario
from app.models.schemas import ProposedAction, Scenario, ToolCall


def propose_action(scenario: Scenario) -> tuple[ToolCall, str]:
    """Return the hardcoded proposed tool call for this scenario."""
    return scenario.proposed_action, scenario.agent_thought


def pretty_call(tool: ToolCall) -> str:
    parts = []
    for name, labeled in tool.arguments.items():
        val = labeled.value
        if isinstance(val, str):
            parts.append(f"{name}={val!r}")
        else:
            parts.append(f"{name}={val}")
    return f"{tool.name}({', '.join(parts)})"


def load_and_propose(scenario_id: str) -> tuple[Scenario, ToolCall, ProposedAction]:
    scenario = get_scenario(scenario_id)
    tool, _ = propose_action(scenario)
    proposed = ProposedAction(name=tool.name, pretty=pretty_call(tool), arguments=tool.arguments)
    return scenario, tool, proposed
