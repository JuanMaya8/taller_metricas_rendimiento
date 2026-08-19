import type { INPRating } from "../types";

interface Props {
  valueMs: number | null;
  rating: INPRating;
  goodThresholdMs: number;
  lastInteractionMs?: number | null;
}

const RATING_LABEL: Record<INPRating, string> = {
  good: "Good",
  "needs-improvement": "Needs improvement",
  poor: "Poor",
  pending: "Waiting for an interaction…",
};

export function PerformancePanel({ valueMs, rating, goodThresholdMs, lastInteractionMs }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>INP — Interaction to Next Paint</h2>
      </div>

      <div className={`inp-readout inp-${rating}`}>
        <span className="inp-value mono">{valueMs === null ? "—" : Math.round(valueMs)}</span>
        <span className="inp-unit">ms</span>
      </div>
      <div className="inp-last-interaction">Last interaction: <span className="mono">{lastInteractionMs === null || lastInteractionMs === undefined ? "—" : Math.round(lastInteractionMs) + "ms"}</span></div>
      <div className={`inp-rating inp-rating-${rating}`}>{RATING_LABEL[rating]}</div>

      <p className="panel-note">
        This is measured live by the browser's Event Timing API through the official{" "}
        <code className="mono">web-vitals</code> library, not simulated. It reports the worst
        interaction observed so far in this page session and only grows, per the Core Web Vitals
        spec, so reload the page to reset it.
      </p>
      <p className="panel-footnote">
        Target for this assignment: stay at or below {goodThresholdMs}ms. Click "Run blocking" in
        the ash dispersion panel, then click anything else — INP will jump past that line. Run the
        chunked version instead and it should hold steady under it.
      </p>
    </section>
  );
}
