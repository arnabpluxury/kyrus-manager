import logoMark from "../assets/kyrus-logo.png";
import { formatBytes } from "../lib/format";

export type BusyState = {
  active: boolean;
  title: string;
  phase: string;
  detail: string;
  percent: number;
  current: number;
  total: number;
  bytesSoFar: number;
  indeterminate: boolean;
};

const EMPTY: BusyState = {
  active: false,
  title: "",
  phase: "",
  detail: "",
  percent: 0,
  current: 0,
  total: 0,
  bytesSoFar: 0,
  indeterminate: true,
};

export function idleBusy(): BusyState {
  return { ...EMPTY };
}

/** Modern dimmed overlay — no heavy card; Windows-like progress with more detail. */
export function PixelLoader({ state }: { state: BusyState }) {
  if (!state.active) return null;

  const pct = state.indeterminate ? null : Math.min(100, Math.max(0, state.percent));

  return (
    <div className="work-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="work-overlay-veil" aria-hidden />
      <div className="work-sheet">
        <div className="work-mark-wrap" aria-hidden>
          <img src={logoMark} alt="" className="work-mark" draggable={false} />
          <span className="work-orbit" />
        </div>

        <div className="work-copy">
          <div className="work-title">{state.title || "Working"}</div>
          <div className="work-phase mono">{state.phase || "…"}</div>
          <div className="work-detail" title={state.detail}>
            {state.detail || "Please wait"}
          </div>
        </div>

        <div className="work-track" aria-hidden>
          <div
            className={`work-fill${pct == null ? " indeterminate" : ""}`}
            style={pct != null ? { width: `${pct}%` } : undefined}
          />
        </div>

        <div className="work-meta mono">
          {pct != null ? (
            <>
              <span className="work-pct">{pct.toFixed(0)}%</span>
              {state.total > 0 && (
                <span>
                  {state.current}/{state.total}
                </span>
              )}
            </>
          ) : (
            <span className="work-pulse-label">In progress</span>
          )}
          {state.bytesSoFar > 0 && <span>{formatBytes(state.bytesSoFar)}</span>}
        </div>
      </div>
    </div>
  );
}
