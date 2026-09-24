const NODES = [
  "User Intent",
  "AI Agent",
  "Untrusted Content",
  "Proposed Tool Action",
  "Guard",
  "Decision",
];

export default function Flow({ result, step }) {
  const decision = result?.enforcement?.decision;
  const mode = result?.audit?.mode;
  const guardLabel = mode === "unprotected" ? "No Guard" : "IntentLock";
  const lastLabel = result
    ? mode === "unprotected"
      ? "EXECUTE"
      : decision
    : "ALLOW / BLOCK / ASK";

  return (
    <section className="glass shadow-panel rounded-md px-4 py-5 sm:px-6">
      <h3 className="mb-4 font-serif text-lg">Live visual flow</h3>
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {NODES.map((label, i) => {
          const shown =
            i === 4 ? guardLabel : i === 5 ? lastLabel : label;
          const active = result ? i < step : false;
          const isDecision = i === 5 && result && step >= 6;
          const tone = isDecision
            ? decisionTone(mode === "unprotected" ? "EXECUTE" : decision)
            : active
              ? "border-amber-soft/60 bg-amber-wash"
              : "border-line bg-white/40 text-mute";
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`rounded-sm border px-2.5 py-1.5 font-medium ${tone}`}
              >
                {shown}
              </span>
              {i < NODES.length - 1 && (
                <span className="text-mute" aria-hidden>
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function decisionTone(d) {
  if (d === "BLOCK") return "border-red-900/30 bg-red-50 text-red-950";
  if (d === "ASK") return "border-amber-soft/50 bg-amber-wash text-ink";
  return "border-emerald-900/25 bg-emerald-50 text-emerald-950";
}
