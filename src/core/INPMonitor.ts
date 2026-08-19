import { onINP, INPThresholds, type Metric } from "web-vitals";
import type { INPRating } from "../types";

type INPListener = (valueMs: number, rating: INPRating) => void;
type RecentInteractionListener = (latencyMs: number) => void;

export class INPMonitor {
  private listeners: INPListener[] = [];
  private recentListeners: RecentInteractionListener[] = [];
  private latestValueMs: number | null = null;
  private latestRating: INPRating = "pending";
  private started = false;
  private boundHandleInteraction: (ev: Event) => void = () => {};

  public getGoodThresholdMs(): number {
    return INPThresholds[0];
  }

  public start(): void {
    if (this.started) return;
    this.started = true;

    onINP(
      (metric: Metric) => {
        this.latestValueMs = metric.value;
        this.latestRating = metric.rating as INPRating;
        for (const listener of this.listeners) {
          listener(this.latestValueMs, this.latestRating);
        }
      },
      { reportAllChanges: true },
    );

    this.boundHandleInteraction = (_ev: Event) => {
      const start = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const latency = performance.now() - start;
        for (const rl of this.recentListeners) rl(latency);
      }));
    };

    document.addEventListener("pointerdown", this.boundHandleInteraction, { capture: true });
    document.addEventListener("keydown", this.boundHandleInteraction, { capture: true });
  }

  public subscribe(listener: INPListener): void {
    this.listeners.push(listener);
  }

  public unsubscribe(listener: INPListener): void {
    this.listeners = this.listeners.filter((current) => current !== listener);
  }

  public subscribeRecent(listener: RecentInteractionListener): void {
    this.recentListeners.push(listener);
  }

  public unsubscribeRecent(listener: RecentInteractionListener): void {
    this.recentListeners = this.recentListeners.filter((l) => l !== listener);
  }

  public getLatestValueMs(): number | null {
    return this.latestValueMs;
  }

  public getLatestRating(): INPRating {
    return this.latestRating;
  }
}
