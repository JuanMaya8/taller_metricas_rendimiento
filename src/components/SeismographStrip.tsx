import { useMemo } from "react";
import type { SensorReading } from "../types";

interface Props {
  readings: SensorReading[];
  width?: number;
  height?: number;
}


export function SeismographStrip({ readings, width = 900, height = 120 }: Props) {
  const points = useMemo(() => {
    if (readings.length === 0) return "";
    const maxMagnitude = 5;
    const step = width / Math.max(readings.length - 1, 1);

    return readings
      .map((reading, index) => {
        const x = index * step;
        const normalized = Math.min(reading.seismicMagnitude / maxMagnitude, 1);
        const y = height - normalized * (height - 16) - 8;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [readings, width, height]);

  const gridLines = 5;

  return (
    <svg
      className="seismograph"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Live seismic magnitude trace"
    >
      {Array.from({ length: gridLines }).map((_, i) => (
        <line
          key={i}
          x1={0}
          x2={width}
          y1={(height / gridLines) * i}
          y2={(height / gridLines) * i}
          className="seismograph-grid"
        />
      ))}
      {points && <polyline points={points} className="seismograph-trace" />}
    </svg>
  );
}
