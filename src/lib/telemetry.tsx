import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import type { PerformanceSnapshot } from "../types";
import { fixtureEnabled, fixtureHistory, fixturePerf } from "./visualFixture";

export type TelemetrySample = {
  t: number;
  cpu: number;
  memory: number;
  diskRead: number;
  diskWrite: number;
  netRx: number;
  netTx: number;
};

const HISTORY_LIMIT = 80;
const POLL_MS = 1500;

type TelemetryValue = {
  perf: PerformanceSnapshot | null;
  history: TelemetrySample[];
  paused: boolean;
  setPaused: (paused: boolean) => void;
  rangeSec: 30 | 60;
  setRangeSec: (seconds: 30 | 60) => void;
};

const TelemetryContext = createContext<TelemetryValue | null>(null);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const useFixture = fixtureEnabled();
  const [perf, setPerf] = useState<PerformanceSnapshot | null>(() => (useFixture ? fixturePerf() : null));
  const [history, setHistory] = useState<TelemetrySample[]>(() => (useFixture ? fixtureHistory(60) : []));
  const [paused, setPaused] = useState(false);
  const [rangeSec, setRangeSec] = useState<30 | 60>(60);
  const inFlight = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const tick = useCallback(() => {
    if (useFixture) {
      setPerf(fixturePerf());
      if (!pausedRef.current) setHistory(fixtureHistory(60));
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    api
      .performance()
      .then((snap) => {
        setPerf(snap);
        if (pausedRef.current) return;
        const memory = snap.memoryTotal > 0 ? (snap.memoryUsed / snap.memoryTotal) * 100 : 0;
        const sample: TelemetrySample = {
          t: Date.now(),
          cpu: snap.cpuUsage,
          memory,
          diskRead: snap.diskReadBytesPerSec,
          diskWrite: snap.diskWriteBytesPerSec,
          netRx: snap.networkRxBytesPerSec,
          netTx: snap.networkTxBytesPerSec,
        };
        setHistory((prev) => [...prev, sample].slice(-HISTORY_LIMIT));
      })
      .catch(() => undefined)
      .finally(() => {
        inFlight.current = false;
      });
  }, [useFixture]);

  useEffect(() => {
    tick();
    if (useFixture) return;
    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [tick, useFixture]);

  const value = useMemo(
    () => ({ perf, history, paused, setPaused, rangeSec, setRangeSec }),
    [perf, history, paused, rangeSec],
  );

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error("useTelemetry must be used within TelemetryProvider");
  return ctx;
}

export function windowSamples(history: TelemetrySample[], seconds: number, paused: boolean) {
  if (!history.length) return history;
  const end = paused ? history[history.length - 1].t : Date.now();
  const cut = end - seconds * 1000;
  const rows = history.filter((sample) => sample.t >= cut);
  return rows.length ? rows : history.slice(-1);
}
