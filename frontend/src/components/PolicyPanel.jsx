export default function PolicyPanel({ policy, userRequest }) {
  return (
    <section className="glass shadow-panel rounded-md p-5">
      <h3 className="font-serif text-lg">Task policy</h3>
      {!policy ? (
        <p className="mt-2 text-sm text-mute">
          Compiled from the user’s original request after you run a scenario.
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-mute">
            Goal: <span className="text-ink">{policy.goal}</span>
          </p>
          {userRequest && (
            <p className="text-xs italic text-mute">Source: “{userRequest}”</p>
          )}
          <TagList label="ALLOW" items={policy.allowed_actions} kind="allow" />
          <TagList label="DENY" items={policy.denied_actions} kind="deny" />
          <ul className="list-disc space-y-1 pl-4 text-mute">
            {policy.constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function TagList({ label, items, kind }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-mute">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <span
            key={t}
            className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] ${
              kind === "allow"
                ? "border-line bg-white"
                : "border-red-900/15 bg-red-50/80 text-red-950"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
