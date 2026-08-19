import { SeismicSensor } from "./SeismicSensor";
import type { SensorReading } from "../types";

type ReadingListener = (reading: SensorReading) => void;

export class SensorNetwork {
  private readonly sensors: SeismicSensor[] = [];
  private listeners: ReadingListener[] = [];
  private intervalId: number | null = null;

  public addSensor(sensor: SeismicSensor): void {
    this.sensors.push(sensor);
  }

  public getSensors(): readonly SeismicSensor[] {
    return this.sensors;
  }

  public subscribe(listener: ReadingListener): void {
    this.listeners.push(listener);
  }

  public unsubscribe(listener: ReadingListener): void {
    this.listeners = this.listeners.filter((current) => current !== listener);
  }

  public isPolling(): boolean {
    return this.intervalId !== null;
  }

  public startPolling(intervalMs = 2200): void {
    if (this.intervalId !== null) return;

    this.intervalId = window.setInterval(() => {
      for (const sensor of this.sensors) {
        this.notify(sensor.generateReading());
      }
    }, intervalMs);
  }

  public stopPolling(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private notify(reading: SensorReading): void {
    for (const listener of this.listeners) {
      listener(reading);
    }
  }
}
