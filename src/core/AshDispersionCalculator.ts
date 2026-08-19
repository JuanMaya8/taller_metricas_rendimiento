import type { DispersionGrid } from "../types";

/**
 * Computes a simulated ash dispersion field downwind of the crater as a
 * gridSize x gridSize heat grid. The formula itself has no scientific
 * pretension; it is deliberately expensive per-cell so the difference
 * between the blocking and non-blocking strategies below is easy to see
 * and measure with INP.
 */
export class AshDispersionCalculator {
  private readonly gridSize: number;
  private readonly workPerCell: number;

  constructor(gridSize = 220, workPerCell = 450) {
    this.gridSize = gridSize;
    this.workPerCell = workPerCell;
  }

  public getGridSize(): number {
    return this.gridSize;
  }

  /**
   * BLOCKING strategy: the entire grid is computed inside a single
   * synchronous call. While this runs, the call stack never empties, so the
   * browser cannot process input events, run rAF callbacks, or paint.
   * A click that lands during this call will be queued and only handled
   * once the function returns, which is exactly what drives INP up.
   */
  public computeSync(windDirectionDeg: number, windSpeed: number): DispersionGrid {
    const start = performance.now();
    const values: number[][] = [];

    for (let y = 0; y < this.gridSize; y++) {
      const row: number[] = new Array(this.gridSize);
      for (let x = 0; x < this.gridSize; x++) {
        row[x] = this.dispersionAt(x, y, windDirectionDeg, windSpeed);
      }
      values.push(row);
    }

    return { size: this.gridSize, values, computeTimeMs: performance.now() - start, mode: "blocking" };
  }

  /**
   * NON-BLOCKING strategy: the same grid, computed in row chunks. After
   * each chunk the function awaits a setTimeout(0) promise, which returns
   * control to the event loop and lets any pending macrotask (including
   * queued clicks and the next paint) run before the next chunk starts.
   * Total CPU work is identical to computeSync; only the scheduling
   * changes, which is precisely why this keeps INP low.
   */
  public async computeChunked(
    windDirectionDeg: number,
    windSpeed: number,
    rowsPerChunk = 8,
  ): Promise<DispersionGrid> {
    const start = performance.now();
    const values: number[][] = [];

    for (let y = 0; y < this.gridSize; y++) {
      const row: number[] = new Array(this.gridSize);
      for (let x = 0; x < this.gridSize; x++) {
        row[x] = this.dispersionAt(x, y, windDirectionDeg, windSpeed);
      }
      values.push(row);

      if (y % rowsPerChunk === rowsPerChunk - 1) {
        await this.yieldToEventLoop();
      }
    }

    return { size: this.gridSize, values, computeTimeMs: performance.now() - start, mode: "chunked" };
  }

  private yieldToEventLoop(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  private dispersionAt(x: number, y: number, windDirectionDeg: number, windSpeed: number): number {
    const windRad = (windDirectionDeg * Math.PI) / 180;
    let acc = 0;

    for (let i = 0; i < this.workPerCell; i++) {
      acc += Math.sin(x * 0.013 + i + windRad) * Math.cos(y * 0.013 + i) * windSpeed;
    }

    const dx = x - this.gridSize / 2;
    const dy = y - this.gridSize / 2;
    const distanceFromCrater = Math.sqrt(dx * dx + dy * dy) + 1;

    return Math.abs(acc) / distanceFromCrater;
  }
}
