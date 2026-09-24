const FLOW_BASE = [
  "User Intent",
  "AI Agent",
  "Untrusted Content",
  "Proposed Tool Action",
  "Guard",
  "Decision",
];

const state = {
  scenarios: [],
  scenarioId: "malicious-webpage",
  mode: "intentlock",
  result: null,
  audit: [],
  step: 0,
  busy: false,
};

const $ = (id) => document.getElementById(id);

async function boot() {
  bindMode();
  $("run-btn").addEventListener("click", onRun);
  try {
    state.scenarios = await (await fetch("/api/scenarios")).json();
    state.audit = await (await fetch("/api/audit")).json();
  } catch (err) {
    $("error").textContent = err.message || "Could not reach the API.";
  }
  renderChips();
  renderFlow();
  renderAudit();
}

function bindMode() {
  $("mode-toggle").querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      $("mode-toggle").querySelectorAll("button").forEach((b) => {
        b.classList.toggle("on", b === btn);
      });
      renderFlow();
      if (state.result) renderDecision();
    });
  });
}

function renderChips() {
  const wrap = $("scenario-chips");
  wrap.innerHTML = "";
  state.scenarios.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (s.id === state.scenarioId ? " on" : "");
    b.textContent = s.title;
    b.addEventListener("click", () => {
      state.scenarioId = s.id;
      renderChips();
    });
    wrap.appendChild(b);
  });
  const selected = state.scenarios.find((s) => s.id === state.scenarioId);
  $("scenario-meta").textContent = selected
    ? `${selected.language} · ${selected.content_kind} · ${selected.notes}`
    : "";
}

function renderFlow() {
  const ol = $("flow");
  ol.innerHTML = "";
  const runMode = state.result?.audit?.mode || state.mode;
  const guard = runMode === "intentlock" ? "IntentLock" : "No Guard";
  const decision = state.result?.enforcement?.decision;
  const last = state.result
    ? runMode === "unprotected"
      ? "EXECUTE"
      : decision
    : "ALLOW / BLOCK / ASK";
  FLOW_BASE.forEach((label, i) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "0.45rem";
    const node = document.createElement("span");
    const shown = i === 4 ? guard : i === 5 ? last : label;
    node.textContent = shown;
    node.className = "node";
    const active = state.result ? i < state.step : false;
    const isDecision = i === 5 && state.result && state.step >= 6;
    if (isDecision) node.classList.add(toneClass(runMode === "unprotected" ? "EXECUTE" : decision));
    else if (active) node.classList.add("on");
    li.appendChild(node);
    if (i < FLOW_BASE.length - 1) {
      const ar = document.createElement("span");
      ar.className = "arrow";
      ar.textContent = "→";
      li.appendChild(ar);
    }
    ol.appendChild(li);
  });
}

function toneClass(d) {
  if (d === "BLOCK") return "block";
  if (d === "ALLOW") return "allow";
  return "ask";
}

function formatVal(v) {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}

function renderSteps() {
  const el = $("steps");
  const result = state.result;
  if (!result) return;
  const s = result.scenario;
  const args = Object.entries(result.proposed.arguments || {});
  el.innerHTML = `
    <h3>Step-by-step attack visualization</h3>
    <div class="step">
      <div class="step-h"><span class="n">01</span><strong>User request</strong></div>
      <p><em>“${escapeHtml(s.user_request)}”</em></p>
    </div>
    <div class="step">
      <div class="step-h"><span class="n">02</span><strong>External content · ${escapeHtml(s.external_source)}</strong></div>
      <pre>${escapeHtml(s.external_content)}</pre>
    </div>
    <div class="step">
      <div class="step-h"><span class="n">03</span><strong>Agent’s proposed tool action</strong></div>
      <p class="muted" style="margin-bottom:0.5rem">${escapeHtml(s.agent_thought)}</p>
      <p class="mono" style="font-size:13px">${escapeHtml(result.proposed.pretty)}</p>
      ${args
        .map(([name, labeled]) => {
          const untrusted = labeled.provenance === "external";
          return `<div class="arg">
            <span class="mono">${escapeHtml(name)}</span>
            <span class="muted">=</span>
            <span class="mono">${escapeHtml(formatVal(labeled.value))}</span>
            <span class="badge ${untrusted ? "hot" : ""}">${untrusted ? "untrusted" : labeled.provenance} · ${escapeHtml(labeled.source)}</span>
          </div>`;
        })
        .join("")}
    </div>
    <div class="step">
      <div class="step-h"><span class="n">04</span><strong>Why this matters</strong></div>
      <p class="muted">${escapeHtml(s.notes)}</p>
    </div>
  `;
}

function renderPolicy() {
  const el = $("policy");
  const p = state.result?.policy;
  if (!p) return;
  el.innerHTML = `
    <h3>Task policy</h3>
    <p class="muted" style="margin-bottom:0.6rem">Goal: <span style="color:var(--ink)">${escapeHtml(p.goal)}</span></p>
    <p class="muted" style="font-size:12px;font-style:italic;margin-bottom:0.8rem">Source: “${escapeHtml(p.user_request)}”</p>
    <p class="kicker" style="margin:0 0 0.3rem">ALLOW</p>
    <div class="tags">${p.allowed_actions.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
    <p class="kicker" style="margin:0 0 0.3rem">DENY</p>
    <div class="tags">${p.denied_actions.map((t) => `<span class="tag deny">${escapeHtml(t)}</span>`).join("")}</div>
    <ul class="plain">${p.constraints.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
  `;
}

function renderDecision() {
  const el = $("decision");
  const result = state.result;
  if (!result) return;
  const runMode = result.audit?.mode || state.mode;
  const shown = runMode === "unprotected" ? "EXECUTE" : result.enforcement.decision;
  const checks = result.enforcement.checks || [];
  el.innerHTML = `
    <h3>Security decision</h3>
    <span class="verdict node ${toneClass(shown)}">${escapeHtml(shown)}</span>
    <p>${escapeHtml(result.enforcement.reason)}</p>
    <p class="muted" style="margin-top:0.5rem">${escapeHtml(result.execution_note)}</p>
    <p style="margin-top:0.5rem;font-size:0.9rem">Simulated execution: <strong>${result.executed ? "would run" : "held"}</strong></p>
    ${
      runMode === "intentlock"
        ? checks
            .map(
              (c) =>
                `<div class="check"><span class="mono muted">${escapeHtml(c.rule)}</span>
                 <span class="muted"> ${c.passed ? "pass" : "fail"} </span>
                 <span>${escapeHtml(c.detail)}</span></div>`
            )
            .join("")
        : ""
    }
  `;
}

function renderAudit() {
  const el = $("audit");
  if (!state.audit.length) {
    el.innerHTML = `<p class="muted">No runs yet.</p>`;
    return;
  }
  el.innerHTML = `<div style="overflow-x:auto"><table>
    <thead><tr>
      <th>Time</th><th>Scenario</th><th>Mode</th><th>Tool</th><th>Decision</th><th>Ran</th>
    </tr></thead>
    <tbody>
      ${state.audit
        .map((e) => {
          const t = new Date(e.timestamp).toLocaleTimeString();
          return `<tr>
            <td class="mono" style="font-size:11px;color:var(--mute)">${t}</td>
            <td>${escapeHtml(e.scenario_title)}</td>
            <td>${escapeHtml(e.mode)}</td>
            <td class="mono trunc" style="font-size:11px">${escapeHtml(e.proposed_tool)}</td>
            <td class="mono" style="font-size:12px">${escapeHtml(e.decision)}</td>
            <td>${e.executed ? "yes" : "no"}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table></div>`;
}

async function onRun() {
  state.busy = true;
  $("run-btn").disabled = true;
  $("error").textContent = "";
  try {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_id: state.scenarioId, mode: state.mode }),
    });
    if (!res.ok) throw new Error("Run failed");
    state.result = await res.json();
    state.audit = await (await fetch("/api/audit")).json();
    state.step = 0;
    renderSteps();
    renderPolicy();
    renderDecision();
    renderAudit();
    const tick = () => {
      state.step += 1;
      renderFlow();
      if (state.step < 6) window.setTimeout(tick, 220);
    };
    window.setTimeout(tick, 80);
  } catch (err) {
    $("error").textContent = err.message || "Could not reach the IntentLock API.";
  } finally {
    state.busy = false;
    $("run-btn").disabled = false;
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

boot();
