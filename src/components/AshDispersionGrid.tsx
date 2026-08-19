import { useEffect, useRef } from "react";
import type { DispersionGrid } from "../types";

interface Props {
  grid: DispersionGrid | null;
  runningMode: "idle" | "blocking" | "chunked";
  onRunBlocking: () => void;
  onRunChunked: () => void;
}

function colorForValue(normalized: number): [number, number, number] {
  // dark basalt -> sulfur -> lava -> cream, matching the console palette
  const stops: [number, [number, number, number]][] = [
    [0, [11, 13, 9]],
    [0.35, [122, 50, 32]],
    [0.65, [232, 197, 71]],
    [1, [255, 90, 46]],
  ];

  for (let i = 0; i < stops.length - 1; i++) {
    const [stopA, colorA] = stops[i];
    const [stopB, colorB] = stops[i + 1];
    if (normalized >= stopA && normalized <= stopB) {
      const t = (normalized - stopA) / (stopB - stopA || 1);
      return [
        Math.round(colorA[0] + (colorB[0] - colorA[0]) * t),
        Math.round(colorA[1] + (colorB[1] - colorA[1]) * t),
        Math.round(colorA[2] + (colorB[2] - colorA[2]) * t),
      ];
    }
  }
  return stops[stops.length - 1][1];
}

export function AshDispersionGrid({ grid, runningMode, onRunBlocking, onRunChunked }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!grid) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = grid.size;
    canvas.height = grid.size;

    let max = 0;
    for (const row of grid.values) {
      for (const value of row) if (value > max) max = value;
    }

    const imageData = ctx.createImageData(grid.size, grid.size);
    for (let y = 0; y < grid.size; y++) {
      for (let x = 0; x < grid.size; x++) {
        const value = grid.values[y][x];
        const normalized = max > 0 ? value / max : 0;
        const [r, g, b] = colorForValue(normalized);
        const idx = (y * grid.size + x) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [grid]);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Ash dispersion model</h2>
      </div>
      <p className="panel-note">
        Same heavy per-cell computation, two schedules. Click a run button, then immediately try
        clicking another button on the page while it works.
      </p>

      <div className="dispersion-body">
        <div className="dispersion-canvas-wrap">
          <canvas ref={canvasRef} className="dispersion-canvas" aria-label="Ash dispersion heatmap" />
          {!grid && <div className="dispersion-placeholder">Run a model to render the grid</div>}
        </div>

        <div className="dispersion-controls">
          <button className="btn btn-danger" onClick={onRunBlocking} disabled={runningMode !== "idle"}>
            Run blocking (sync)
          </button>
          <button className="btn btn-good" onClick={onRunChunked} disabled={runningMode !== "idle"}>
            Run optimized (chunked)
          </button>

          <div className="dispersion-status mono">
            {runningMode === "blocking" && "main thread frozen…"}
            {runningMode === "chunked" && "yielding between row chunks…"}
            {runningMode === "idle" && grid && `${grid.mode} run: ${grid.computeTimeMs.toFixed(1)}ms of work`}
            {runningMode === "idle" && !grid && "idle"}
          </div>

          <p className="panel-footnote">
            Blocking runs the whole 220×220 grid inside one synchronous call — the UI cannot react
            to anything until it returns. Chunked runs the identical math but awaits{" "}
            <code className="mono">setTimeout(0)</code> every 8 rows, handing control back to the
            event loop so pending clicks and paints get a turn.
          </p>
        </div>
      </div>
    </section>
  );
}
