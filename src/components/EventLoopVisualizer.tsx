import type { EventLoopLogEntry } from "../types";

interface Props {
  log: EventLoopLogEntry[];
  onDemonstrateOrdering: () => void;
  onQueueMicrotask: () => void;
  onQueueMacrotask: () => void;
  onClear: () => void;
}

export function EventLoopVisualizer({
  log,
  onDemonstrateOrdering,
  onQueueMicrotask,
  onQueueMacrotask,
  onClear,
}: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Event loop scheduler</h2>
        <button className="btn btn-ghost" onClick={onClear}>
          Clear log
        </button>
      </div>
      <p className="panel-note">
        Microtasks always fully drain before the next macrotask runs. Queue both and watch the
        execution order in the log below, no matter which button you press first.
      </p>

      <div className="scheduler-controls">
        <button className="btn" onClick={onDemonstrateOrdering}>
          Run ordering demo
        </button>
        <button className="btn btn-ghost" onClick={onQueueMicrotask}>
          + Queue microtask
        </button>
        <button className="btn btn-ghost" onClick={onQueueMacrotask}>
          + Queue macrotask
        </button>
      </div>

      {log.length === 0 ? (
        <div className="empty-state">No scheduled tasks logged yet.</div>
      ) : (
        <ol className="log-list mono">
          {log.map((entry) => (
            <li key={entry.id} className={`log-row log-${entry.kind}`}>
              <span className={`log-badge log-badge-${entry.kind}`}>
                {entry.kind === "microtask" ? "MICRO" : "MACRO"}
              </span>
              <span className="log-label">{entry.label}</span>
              <span className="log-delay">+{(entry.executedAt - entry.queuedAt).toFixed(2)}ms</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
