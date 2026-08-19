import type { DispersionGrid } from "../types";


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
