const API = "";

export async function fetchScenarios() {
  const res = await fetch(`${API}/api/scenarios`);
  if (!res.ok) throw new Error("Failed to load scenarios");
  return res.json();
}

export async function runScenario(scenarioId, mode) {
  const res = await fetch(`${API}/api/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario_id: scenarioId, mode }),
  });
  if (!res.ok) throw new Error("Run failed");
  return res.json();
}

export async function fetchAudit() {
  const res = await fetch(`${API}/api/audit`);
  if (!res.ok) throw new Error("Failed to load audit log");
  return res.json();
}
