import type { VolcanoAlert } from "../types";

interface Props {
  alerts: VolcanoAlert[];
  onAcknowledge: (id: string) => void;
}

export function AlertPanel({ alerts, onAcknowledge }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Alerts</h2>
      </div>
      <p className="panel-note">
        Orange and red alerts are delivered as microtasks so they never wait behind the next
        sensor poll. Yellow alerts are delivered as a macrotask, which is fine since they aren't
        urgent.
      </p>

      {alerts.length === 0 ? (
        <div className="empty-state">No active alerts. All stations nominal.</div>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => (
            <li key={alert.id} className={`alert-row alert-${alert.level}`}>
              <span className={`alert-dot alert-dot-${alert.level}`} />
              <span className="alert-message">{alert.message}</span>
              <button className="btn btn-ghost btn-small" onClick={() => onAcknowledge(alert.id)}>
                Acknowledge
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
