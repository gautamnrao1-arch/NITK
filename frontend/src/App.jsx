import { useEffect, useMemo, useState } from "react";
import { fetchAudit, fetchScenarios, runScenario } from "./api";
import Flow from "./components/Flow";
import StepViz from "./components/StepViz";
import PolicyPanel from "./components/PolicyPanel";
import DecisionPanel from "./components/DecisionPanel";
import AuditTrace from "./components/AuditTrace";

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [scenarioId, setScenarioId] = useState("malicious-webpage");
  const [mode, setMode] = useState("intentlock");
  const [result, setResult] = useState(null);
  const [audit, setAudit] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    fetchScenarios()
      .then(setScenarios)
      .catch((e) => setError(e.message));
    fetchAudit()
      .then(setAudit)
      .catch(() => {});
  }, []);

  const selected = useMemo(
    () => scenarios.find((s) => s.id === scenarioId),
    [scenarios, scenarioId]
  );

  async function onRun() {
    setBusy(true);
    setError(null);
    setStep(0);
    setResult(null);
    try {
      const data = await runScenario(scenarioId, mode);
      setResult(data);
      const events = await fetchAudit();
      setAudit(events);
      let i = 0;
      const tick = () => {
        i += 1;
        setStep(i);
        if (i < 6) window.setTimeout(tick, 220);
      };
      window.setTimeout(tick, 80);
    } catch (e) {
      setError(e.message || "Could not reach the IntentLock API.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8">
        <header className="mb-10 border-b border-line pb-8">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
            Research prototype · NITK
          </p>
          <h1 className="font-serif text-4xl leading-tight text-ink sm:text-[2.6rem]">
            IntentLock
          </h1>
          <p className="mt-3 max-w-3xl text-[1.05rem] leading-relaxed text-mute">
            Provenance-typed, information-bounded action enforcement for AI agents.
            Even when an agent is influenced by malicious external content, an
            independent authorization layer can prevent actions that fall outside
            the user’s original intent.
          </p>
        </header>

        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl">Attack Lab</h2>
              <p className="mt-1 text-sm text-mute">
                Hard-coded indirect prompt-injection scenarios. No real mail,
                files, or payments leave this machine.
              </p>
            </div>
            <ModeToggle mode={mode} onChange={setMode} />
          </div>

          <div className="glass shadow-panel rounded-md p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setScenarioId(s.id)}
                  className={`rounded-sm border px-3 py-1.5 text-sm transition ${
                    scenarioId === s.id
                      ? "border-amber-soft/50 bg-amber-wash text-ink"
                      : "border-line bg-white/40 text-mute hover:border-ink/20 hover:text-ink"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
            {selected && (
              <p className="mt-4 text-sm text-mute">
                {selected.language} · {selected.content_kind} · {selected.notes}
              </p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={onRun}
                disabled={busy || !scenarios.length}
                className="rounded-sm border border-ink/80 bg-ink px-4 py-2 text-sm text-paper transition hover:bg-ink/90 disabled:opacity-50"
              >
                {busy ? "Running…" : "Run scenario"}
              </button>
              {error && <span className="text-sm text-red-800">{error}</span>}
            </div>
          </div>
        </section>

        <Flow result={result} step={step} />

        <div className="mt-8 grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <StepViz result={result} />
          </div>
          <div className="flex flex-col gap-5 lg:col-span-2">
            <PolicyPanel policy={result?.policy} userRequest={result?.scenario?.user_request} />
            <DecisionPanel result={result} />
          </div>
        </div>

        <AuditTrace events={audit} />

        <footer className="mt-12 border-t border-line pt-6 text-sm text-mute">
          Policy checks are ordinary Python predicates. The model never casts the
          final ALLOW / BLOCK / ASK vote. Simulated tools only.
        </footer>
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex rounded-sm border border-line bg-white/50 p-0.5 text-sm">
      {[
        { id: "unprotected", label: "Unprotected" },
        { id: "intentlock", label: "IntentLock" },
      ].map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-3 py-1.5 ${
            mode === opt.id ? "bg-amber-wash text-ink" : "text-mute"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
