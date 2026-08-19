import { useCallback, useEffect, useRef, useState } from "react";
import { SensorNetwork } from "./core/SensorNetwork";
import { SeismicSensor } from "./core/SeismicSensor";
import { AlertManager } from "./core/AlertManager";
import { EventLoopScheduler } from "./core/EventLoopScheduler";
import { AshDispersionCalculator } from "./core/AshDispersionCalculator";
import { INPMonitor } from "./core/INPMonitor";
import { SeismographStrip } from "./components/SeismographStrip";
import { SensorFeed } from "./components/SensorFeed";
import { AshDispersionGrid } from "./components/AshDispersionGrid";
import { EventLoopVisualizer } from "./components/EventLoopVisualizer";
import { AlertPanel } from "./components/AlertPanel";
import { PerformancePanel } from "./components/PerformancePanel";
import type { DispersionGrid, EventLoopLogEntry, INPRating, SensorReading, VolcanoAlert } from "./types";
import "./App.css";

const MAX_READINGS = 40;
const MAX_LOG = 14;
const MAX_ALERTS = 8;

function App() {
  const sensorNetworkRef = useRef<SensorNetwork | null>(null);
  const alertManagerRef = useRef<AlertManager | null>(null);
  const schedulerRef = useRef<EventLoopScheduler | null>(null);
  const calculatorRef = useRef<AshDispersionCalculator | null>(null);
  const inpMonitorRef = useRef<INPMonitor | null>(null);

  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<VolcanoAlert[]>([]);
  const [eventLoopLog, setEventLoopLog] = useState<EventLoopLogEntry[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [dispersionGrid, setDispersionGrid] = useState<DispersionGrid | null>(null);
  const [dispersionMode, setDispersionMode] = useState<"idle" | "blocking" | "chunked">("idle");
  const [inpValue, setInpValue] = useState<number | null>(null);
  const [inpRating, setInpRating] = useState<INPRating>("pending");
  const [lastInteractionMs, setLastInteractionMs] = useState<number | null>(null);

  useEffect(() => {
    const network = new SensorNetwork();
    network.addSensor(new SeismicSensor("st-01", "Anganoy North Flank", 1.1));
    network.addSensor(new SeismicSensor("st-02", "Crater Rim East", 1.4));
    network.addSensor(new SeismicSensor("st-03", "Tambo Valley West", 0.9));
    network.addSensor(new SeismicSensor("st-04", "Urcunina Ridge", 1.2));
    sensorNetworkRef.current = network;

    const alertManager = new AlertManager();
    alertManagerRef.current = alertManager;

    const scheduler = new EventLoopScheduler();
    schedulerRef.current = scheduler;

    calculatorRef.current = new AshDispersionCalculator(220, 450);

    const inpMonitor = new INPMonitor();
    inpMonitorRef.current = inpMonitor;

    const onReading = (reading: SensorReading) => {
      setReadings((prev) => [...prev.slice(-(MAX_READINGS - 1)), reading]);
      alertManager.evaluateReading(reading);
    };
    const onAlert = (alert: VolcanoAlert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
    };
    const onLog = (entry: EventLoopLogEntry) => {
      setEventLoopLog((prev) => [entry, ...prev].slice(0, MAX_LOG));
    };
    const onInp = (value: number, rating: INPRating) => {
      setInpValue(value);
      setInpRating(rating);
    };
    const onRecent = (latency: number) => {
      setLastInteractionMs(latency);
    };

    network.subscribe(onReading);
    alertManager.subscribe(onAlert);
    scheduler.onLog(onLog);
    inpMonitor.subscribe(onInp);
    inpMonitor.subscribeRecent(onRecent);
    inpMonitor.start();

    network.startPolling();
    setIsPolling(true);

    return () => {
      network.unsubscribe(onReading);
      alertManager.unsubscribe(onAlert);
      scheduler.offLog(onLog);
      inpMonitor.unsubscribe(onInp);
      inpMonitor.unsubscribeRecent(onRecent);
      network.stopPolling();
    };
  }, []);

  const handleTogglePolling = useCallback(() => {
    const network = sensorNetworkRef.current;
    if (!network) return;
    if (network.isPolling()) {
      network.stopPolling();
      setIsPolling(false);
    } else {
      network.startPolling();
      setIsPolling(true);
    }
  }, []);

  const handleDemonstrateOrdering = useCallback(() => {
    schedulerRef.current?.demonstrateOrdering();
  }, []);

  const handleQueueMicrotask = useCallback(() => {
    schedulerRef.current?.scheduleMicrotask("Manual microtask");
  }, []);

  const handleQueueMacrotask = useCallback(() => {
    schedulerRef.current?.scheduleMacrotask("Manual macrotask", 0);
  }, []);

  const handleClearLog = useCallback(() => setEventLoopLog([]), []);

  const handleAcknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const handleRunBlocking = useCallback(() => {
    const calculator = calculatorRef.current;
    if (!calculator) return;
    setDispersionMode("blocking");
    // Everything below runs synchronously: the state update above cannot
    // paint until this call returns, which is the point of this button.
    const grid = calculator.computeSync(230, 18);
    setDispersionGrid(grid);
    setDispersionMode("idle");
  }, []);

  const handleRunChunked = useCallback(async () => {
    const calculator = calculatorRef.current;
    if (!calculator) return;
    setDispersionMode("chunked");
    const grid = await calculator.computeChunked(230, 18, 8);
    setDispersionGrid(grid);
    setDispersionMode("idle");
  }, []);

  const goodThresholdMs = inpMonitorRef.current?.getGoodThresholdMs() ?? 200;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-top">
          <div className="eyebrow">GVO · Galeras Volcano Observatory (simulated console)</div>
          <div className={`inp-badge inp-${inpRating}`}>
            <span className="inp-badge-label">INP</span>
            <span className="inp-badge-value mono">{inpValue === null ? "—" : Math.round(inpValue)}ms</span>
          </div>
        </div>
        <h1>Galeras Watch</h1>
        <p className="app-subtitle">
          A real-time monitoring console for Volcán Galeras, event loop, task and microtask scheduling
        </p>
        <SeismographStrip readings={readings} />
      </header>

      <main className="app-grid">
        <div className="app-column">
          <SensorFeed readings={readings} isPolling={isPolling} onTogglePolling={handleTogglePolling} />
          <AshDispersionGrid
            grid={dispersionGrid}
            runningMode={dispersionMode}
            onRunBlocking={handleRunBlocking}
            onRunChunked={handleRunChunked}
          />
        </div>

        <div className="app-column">
          <EventLoopVisualizer
            log={eventLoopLog}
            onDemonstrateOrdering={handleDemonstrateOrdering}
            onQueueMicrotask={handleQueueMicrotask}
            onQueueMacrotask={handleQueueMacrotask}
            onClear={handleClearLog}
          />
          <AlertPanel alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
          <PerformancePanel
            valueMs={inpValue}
            rating={inpRating}
            goodThresholdMs={goodThresholdMs}
            lastInteractionMs={lastInteractionMs}
          />
        </div>
      </main>

      <footer className="app-footer">
        Simulated sensor data for a Web Programming course assignment on performance metrics and
        the JavaScript event loop. Not affiliated with the Servicio Geológico Colombiano.
      </footer>
    </div>
  );
}

export default App;
