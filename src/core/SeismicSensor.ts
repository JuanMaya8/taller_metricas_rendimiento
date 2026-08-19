import type { SensorReading } from "../types";

/**
 * Represents a single physical monitoring station on the Galeras volcano.
 * Each instance owns its own baseline and produces slightly noisy,
 * occasionally spiking readings, the way a real seismic station would.
 */
export class SeismicSensor {
  private readonly id: string;
  private readonly stationName: string;
  private readonly baselineMagnitude: number;

  constructor(id: string, stationName: string, baselineMagnitude = 1.0) {
    this.id = id;
    this.stationName = stationName;
    this.baselineMagnitude = baselineMagnitude;
  }

  public getId(): string {
    return this.id;
  }

  public getStationName(): string {
    return this.stationName;
  }

  /** Produces one simulated real-time reading for this station. */
  public generateReading(): SensorReading {
    const noise = (Math.random() - 0.5) * 1.4;
    const spike = Math.random() > 0.92 ? Math.random() * 3 : 0;

    return {
      sensorId: this.id,
      stationName: this.stationName,
      timestamp: Date.now(),
      seismicMagnitude: Math.max(0, this.baselineMagnitude + noise + spike),
      sulfurDioxideLevel: Math.max(0, 800 + (Math.random() - 0.5) * 400 + spike * 500),
      surfaceTemperature: Math.max(0, 45 + (Math.random() - 0.5) * 8 + spike * 12),
    };
  }
}
