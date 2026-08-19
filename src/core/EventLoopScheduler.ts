import type { EventLoopLogEntry, TaskKind } from "../types";

type LogListener = (entry: EventLoopLogEntry) => void;

export class EventLoopScheduler {
  private listeners: LogListener[] = [];
  private counter = 0;

  public onLog(listener: LogListener): void {
    this.listeners.push(listener);
  }

  public offLog(listener: LogListener): void {
    this.listeners = this.listeners.filter((current) => current !== listener);
  }

  private emit(kind: TaskKind, label: string, queuedAt: number): void {
    const entry: EventLoopLogEntry = {
      id: `${kind}-${++this.counter}`,
      kind,
      label,
      queuedAt,
      executedAt: performance.now(),
    };
    for (const listener of this.listeners) listener(entry);
  }

  /** Enqueues a callback on the macrotask (task) queue via setTimeout. */
  public scheduleMacrotask(label: string, delayMs = 0): void {
    const queuedAt = performance.now();
    setTimeout(() => this.emit("macrotask", label, queuedAt), delayMs);
  }

  /** Enqueues a callback on the microtask queue via queueMicrotask. */
  public scheduleMicrotask(label: string): void {
    const queuedAt = performance.now();
    queueMicrotask(() => this.emit("microtask", label, queuedAt));
  }

  /** Enqueues a callback on the microtask queue via a resolved Promise. */
  public scheduleMicrotaskViaPromise(label: string): void {
    const queuedAt = performance.now();
    Promise.resolve().then(() => this.emit("microtask", label, queuedAt));
  }


  public demonstrateOrdering(): void {
    this.scheduleMacrotask("setTimeout(0) -> macrotask queue", 0);
    this.scheduleMicrotaskViaPromise("Promise.resolve().then() -> microtask queue");
    this.scheduleMicrotask("queueMicrotask() -> microtask queue");
  }
}
