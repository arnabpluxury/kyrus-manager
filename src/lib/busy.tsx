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
import { listen } from "@tauri-apps/api/event";
import { PixelLoader, idleBusy, type BusyState } from "../components/PixelLoader";

type JobProgressPayload = {
  job: string;
  phase: string;
  detail: string;
  current: number;
  total: number;
  bytesSoFar: number;
  percent: number;
  indeterminate: boolean;
};

const TITLES: Record<string, string> = {
  storage: "Deep storage scan",
  largest: "Disk analyzer",
  treemap: "Building treemap",
  cleanup: "Temp & junk scan",
  bloatware: "Bloatware Free scan",
  delete: "Removing items",
  uninstall: "Uninstalling apps",
};

type BusyApi = {
  begin: (job: string, title?: string) => void;
  end: (job?: string) => void;
  isBusy: boolean;
};

const BusyContext = createContext<BusyApi | null>(null);

export function BusyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BusyState>(idleBusy);
  const activeJob = useRef<string | null>(null);

  const begin = useCallback((job: string, title?: string) => {
    activeJob.current = job;
    setState({
      active: true,
      title: title || TITLES[job] || "Working",
      phase: "starting",
      detail: "Preparing…",
      percent: 0,
      current: 0,
      total: 0,
      bytesSoFar: 0,
      indeterminate: true,
    });
  }, []);

  const end = useCallback((job?: string) => {
    if (job && activeJob.current && job !== activeJob.current) return;
    activeJob.current = null;
    setState(idleBusy());
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    void listen<JobProgressPayload>("job-progress", (event) => {
      if (cancelled) return;
      const p = event.payload;
      if (activeJob.current && p.job !== activeJob.current) return;
      if (p.phase === "done") {
        setState((prev) => ({
          ...prev,
          phase: "done",
          detail: p.detail,
          percent: 100,
          indeterminate: false,
        }));
        return;
      }
      setState((prev) => ({
        ...prev,
        active: true,
        title: prev.title || TITLES[p.job] || "Working",
        phase: p.phase,
        detail: p.detail,
        percent: p.percent,
        current: p.current,
        total: p.total,
        bytesSoFar: p.bytesSoFar,
        indeterminate: p.indeterminate || p.total === 0,
      }));
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  const value = useMemo(
    () => ({ begin, end, isBusy: state.active }),
    [begin, end, state.active],
  );

  return (
    <BusyContext.Provider value={value}>
      {children}
      <PixelLoader state={state} />
    </BusyContext.Provider>
  );
}

export function useBusy() {
  const ctx = useContext(BusyContext);
  if (!ctx) throw new Error("useBusy must be used within BusyProvider");
  return ctx;
}
