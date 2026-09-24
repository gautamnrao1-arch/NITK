export default function StepViz({ result }) {
  if (!result) {
    return (
      <section className="glass shadow-panel rounded-md p-5">
        <h3 className="font-serif text-lg">Step-by-step attack visualization</h3>
        <p className="mt-3 text-sm text-mute">
          Choose a scenario and run it. You will see the user request, the
          untrusted document, the agent’s proposed tool call, then the security
          decision.
        </p>
      </section>
    );
  }

  const { scenario, proposed } = result;
  const args = Object.entries(proposed.arguments || {});

  return (
    <section className="glass shadow-panel rounded-md p-5">
      <h3 className="font-serif text-lg">Step-by-step attack visualization</h3>
      <ol className="mt-4 space-y-4">
        <Step n="01" title="User request">
          <p className="italic">“{scenario.user_request}”</p>
        </Step>
        <Step n="02" title={`External content · ${scenario.external_source}`}>
          <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-ink/90">
            {scenario.external_content}
          </pre>
        </Step>
        <Step n="03" title="Agent’s proposed tool action">
          <p className="mb-2 text-sm text-mute">{scenario.agent_thought}</p>
          <p className="font-mono text-[13px]">{proposed.pretty}</p>
          <ul className="mt-3 space-y-1">
            {args.map(([name, labeled]) => (
              <li key={name} className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className="font-mono">{name}</span>
                <span className="text-mute">=</span>
                <span className="font-mono">{formatVal(labeled.value)}</span>
                <ProvenanceBadge provenance={labeled.provenance} source={labeled.source} />
              </li>
            ))}
          </ul>
        </Step>
        <Step n="04" title="Why this matters">
          <p className="text-sm leading-relaxed text-mute">{scenario.notes}</p>
        </Step>
      </ol>
    </section>
  );
}

function Step({ n, title, children }) {
  return (
    <li className="border-t border-line pt-4 first:border-0 first:pt-0">
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-mute">{n}</span>
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      {children}
    </li>
  );
}

function ProvenanceBadge({ provenance, source }) {
  const untrusted = provenance === "external";
  return (
    <span
      className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
        untrusted
          ? "border-red-900/20 bg-red-50 text-red-900"
          : "border-line bg-white text-mute"
      }`}
    >
      {untrusted ? "untrusted" : provenance} · {source}
    </span>
  );
}

function formatVal(v) {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}
