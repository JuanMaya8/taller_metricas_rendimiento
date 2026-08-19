import type { SensorReading } from "../types";

interface Props {
  readings: SensorReading[];
  isPolling: boolean;
  onTogglePolling: () => void;
}

export function SensorFeed({ readings, isPolling, onTogglePolling }: Props) {
  const latestFirst = [...readings].reverse().slice(0, 8);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Sensor network</h2>
        <button className={isPolling ? "btn btn-active" : "btn"} onClick={onTogglePolling}>
          {isPolling ? "Stop polling" : "Start polling"}
        </button>
      </div>
      <p className="panel-note">
        Four simulated stations poll every ~2.2s via <code className="mono">setInterval</code>, a
        macrotask that re-fires on every event loop tick.
      </p>

      {latestFirst.length === 0 ? (
        <div className="empty-state">No readings yet. Start polling to bring the stations online.</div>
      ) : (
        <ul className="reading-list">
          {latestFirst.map((reading) => (
            <li key={`${reading.sensorId}-${reading.timestamp}`} className="reading-row">
              <span className="reading-station">{reading.stationName}</span>
              <span className="reading-value mono">M {reading.seismicMagnitude.toFixed(2)}</span>
              <span className="reading-value mono">{reading.sulfurDioxideLevel.toFixed(0)} t/day SO2</span>
              <span className="reading-value mono">{reading.surfaceTemperature.toFixed(1)}°C</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
