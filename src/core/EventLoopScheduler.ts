import type { EventLoopLogEntry, TaskKind } from "../types";

type LogListener = (entry: EventLoopLogEntry) => void;

/**
 * A small, explicit wrapper around the two queues the JavaScript event loop
 * drains on every iteration:
 *
 *  - the MICROTASK queue (Promise.then, queueMicrotask, async/await
 *    continuations) which is always fully drained before the engine paints
 *    or picks up the next macrotask;
 *  - the (MACRO)TASK queue (setTimeout, setInterval, UI events) of which
 *    only ONE entry is processed per event loop iteration.
 *
 * Every scheduled item is timestamped when it is queued and again when it
 * actually executes, so the UI can render the real order and the real delay
 * the browser applied.
 */
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

  /**
   * Schedules one macrotask followed by two microtasks, in that call order.
   * Because the microtask queue is always drained completely before the
   * next macrotask runs, both microtasks will always be logged BEFORE the
   * macrotask, no matter that the macrotask was requested first and with a
   * 0ms delay. This is the clearest possible demonstration of queue
   * priority in the event loop.
   */
  public demonstrateOrdering(): void {
    this.scheduleMacrotask("setTimeout(0) -> macrotask queue", 0);
    this.scheduleMicrotaskViaPromise("Promise.resolve().then() -> microtask queue");
    this.scheduleMicrotask("queueMicrotask() -> microtask queue");
  }
}
