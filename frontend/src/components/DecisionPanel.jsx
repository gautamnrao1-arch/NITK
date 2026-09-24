export default function DecisionPanel({ result }) {
  if (!result) {
    return (
      <section className="glass shadow-panel rounded-md p-5">
        <h3 className="font-serif text-lg">Security decision</h3>
        <p className="mt-2 text-sm text-mute">
          IntentLock’s verdict is produced by deterministic Python rules, not by
          another language model.
        </p>
      </section>
    );
  }

  const { enforcement, executed, execution_note, audit } = result;
  const shown = audit?.mode === "unprotected" ? "EXECUTE" : enforcement.decision;

  return (
    <section className="glass shadow-panel rounded-md p-5">
      <h3 className="font-serif text-lg">Security decision</h3>
      <p
        className={`mt-3 inline-block rounded-sm border px-2.5 py-1 font-mono text-sm ${tone(shown)}`}
      >
        {shown}
      </p>
      <p className="mt-3 text-sm leading-relaxed">{enforcement.reason}</p>
      <p className="mt-2 text-sm text-mute">{execution_note}</p>
      <p className="mt-2 text-sm">
        Simulated execution:{" "}
        <span className="font-medium">{executed ? "would run" : "held"}</span>
      </p>
      {audit?.mode === "intentlock" && enforcement.checks?.length > 0 && (
        <ul className="mt-4 space-y-2">
          {enforcement.checks.map((c) => (
            <li key={c.rule} className="border-t border-line pt-2 text-xs">
              <span className="font-mono text-mute">{c.rule}</span>
              <span className="mx-2 text-mute">{c.passed ? "pass" : "fail"}</span>
              <span className="text-ink/80">{c.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function tone(d) {
  if (d === "BLOCK") return "border-red-900/30 bg-red-50 text-red-950";
  if (d === "ASK" || d === "EXECUTE") return "border-amber-soft/50 bg-amber-wash";
  return "border-emerald-900/25 bg-emerald-50 text-emerald-950";
}
