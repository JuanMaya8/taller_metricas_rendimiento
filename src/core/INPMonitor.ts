import { onINP, INPThresholds, type Metric } from "web-vitals";
import type { INPRating } from "../types";

type INPListener = (valueMs: number, rating: INPRating) => void;
type RecentInteractionListener = (latencyMs: number) => void;

/**
 * Wraps the official web-vitals `onINP` reporter behind a small class API.
 *
 * INP (Interaction to Next Paint) is measured by the browser itself using
 * the Event Timing API: for every click, tap or keypress it records the
 * time between the interaction and the next frame the browser paints.
 * web-vitals keeps the worst interaction observed so far and reports it
 * every time it changes, which is exactly what this class relays to the UI.
 *
 * Google's published thresholds (also exported as INPThresholds):
 *   good            <= 200ms
 *   needs-improvement  200ms - 500ms
 *   poor            >  500ms
 */
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

    // Also attach lightweight listeners to report the latency for the most
    // recent interaction. This is useful for UI feedback: web-vitals' INP is
    // defined as the *worst* interaction observed so far and therefore only
    // grows. To show a changing number when users interact repeatedly we
    // report a "last interaction" latency using a double rAF technique.
    this.boundHandleInteraction = (ev: Event) => {
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
