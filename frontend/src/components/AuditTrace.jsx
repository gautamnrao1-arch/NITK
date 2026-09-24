export default function AuditTrace({ events }) {
  return (
    <section className="mt-8 glass shadow-panel rounded-md p-5">
      <h3 className="font-serif text-lg">Audit trace</h3>
      <p className="mt-1 text-sm text-mute">
        In-memory log of each run. Schema is ready to persist to PostgreSQL later.
      </p>
      {!events?.length ? (
        <p className="mt-4 text-sm text-mute">No runs yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-mute">
                <th className="py-2 font-medium">Time</th>
                <th className="py-2 font-medium">Scenario</th>
                <th className="py-2 font-medium">Mode</th>
                <th className="py-2 font-medium">Tool</th>
                <th className="py-2 font-medium">Decision</th>
                <th className="py-2 font-medium">Ran</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-line/70">
                  <td className="py-2 font-mono text-[11px] text-mute">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2">{e.scenario_title}</td>
                  <td className="py-2">{e.mode}</td>
                  <td className="max-w-[240px] truncate py-2 font-mono text-[11px]">
                    {e.proposed_tool}
                  </td>
                  <td className="py-2 font-mono text-[12px]">{e.decision}</td>
                  <td className="py-2">{e.executed ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
