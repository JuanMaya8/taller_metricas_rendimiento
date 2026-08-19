import type { AlertLevel, SensorReading, VolcanoAlert } from "../types";

type AlertListener = (alert: VolcanoAlert) => void;

export class AlertManager {
  private listeners: AlertListener[] = [];
  private counter = 0;

  public subscribe(listener: AlertListener): void {
    this.listeners.push(listener);
  }

  public unsubscribe(listener: AlertListener): void {
    this.listeners = this.listeners.filter((current) => current !== listener);
  }

  public evaluateReading(reading: SensorReading): void {
    const level = this.classify(reading);
    if (level === "green") return;

    const alert: VolcanoAlert = {
      id: `alert-${++this.counter}`,
      level,
      message: this.buildMessage(reading, level),
      timestamp: reading.timestamp,
    };

    if (level === "red" || level === "orange") {
      Promise.resolve().then(() => this.notify(alert));
    } else {
      setTimeout(() => this.notify(alert), 0);
    }
  }

  private classify(reading: SensorReading): AlertLevel {
    if (reading.seismicMagnitude > 3.4 || reading.sulfurDioxideLevel > 2000) return "red";
    if (reading.seismicMagnitude > 2.4 || reading.sulfurDioxideLevel > 1500) return "orange";
    if (reading.seismicMagnitude > 1.7 || reading.sulfurDioxideLevel > 1100) return "yellow";
    return "green";
  }

  private buildMessage(reading: SensorReading, level: AlertLevel): string {
    const tag = level.toUpperCase();
    const magnitude = reading.seismicMagnitude.toFixed(2);
    const so2 = reading.sulfurDioxideLevel.toFixed(0);
    return `[${tag}] ${reading.stationName}: magnitude ${magnitude}, SO2 ${so2} t/day`;
  }

  private notify(alert: VolcanoAlert): void {
    for (const listener of this.listeners) listener(alert);
  }
}
