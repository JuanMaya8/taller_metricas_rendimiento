export interface SensorReading {
  sensorId: string;
  stationName: string;
  timestamp: number;
  seismicMagnitude: number;
  sulfurDioxideLevel: number;
  surfaceTemperature: number;
}

export type AlertLevel = "green" | "yellow" | "orange" | "red";

export interface VolcanoAlert {
  id: string;
  level: AlertLevel;
  message: string;
  timestamp: number;
}

export type TaskKind = "macrotask" | "microtask";

export interface EventLoopLogEntry {
  id: string;
  kind: TaskKind;
  label: string;
  queuedAt: number;
  executedAt: number;
}

export interface DispersionGrid {
  size: number;
  values: number[][];
  computeTimeMs: number;
  mode: "blocking" | "chunked";
}

export type INPRating = "good" | "needs-improvement" | "poor" | "pending";
