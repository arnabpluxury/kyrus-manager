import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { formatBytes } from "../lib/format";
import type { InstalledApp, SpacePrediction } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { useConfirm } from "../components/ConfirmModal";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function AppsView({ notify }: Props) {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [quiet, setQuiet] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [prediction, setPrediction] = useState<SpacePrediction | null>(null);
  const { ask, modal } = useConfirm();

  const load = async () => {
    setLoading(true);
    try {
      setApps(await api.apps());
    } catch (e) {
      notify(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.publisher ?? "").toLowerCase().includes(q) ||
        (a.version ?? "").toLowerCase().includes(q),
    );
  }, [apps, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const predict = async () => {
    try {
      setPrediction(await api.predictSpace({ appIds: [...selected] }));
    } catch (e) {
      notify(String(e));
    }
  };

  const uninstall = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    const ok = await ask({
      title: "Uninstall applications",
      message: `Uninstall ${ids.length} application(s)? Installers may still ask for confirmation.`,
      confirmLabel: "Uninstall",
    });
    if (!ok) return;
    try {
      const results = await api.uninstallApps(ids, quiet, autoAdvance);
      const okCount = results.filter((r) => r.started).length;
      notify(`Started ${okCount}/${results.length} uninstallers${autoAdvance ? " (auto-advance on)" : ""}`);
      setTimeout(() => void load(), 4000);
    } catch (e) {
      notify(String(e));
    }
  };

  return (
    <div className="view">
      <ViewHead
        title="Applications"
        subtitle="Installed apps with publisher, version, size, icons, quiet & multi-uninstall, and wizard auto-advance."
      >
        <Field label="Search">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name / publisher" />
        </Field>
        <Field>
          <input className="check" type="checkbox" checked={quiet} onChange={(e) => setQuiet(e.target.checked)} />
          Prefer quiet
        </Field>
        <Field>
          <input
            className="check"
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => setAutoAdvance(e.target.checked)}
          />
          Auto Next/Yes
        </Field>
        <Button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
        <Button onClick={predict} disabled={!selected.size}>
          Predict space
        </Button>
        <Button variant="danger" onClick={uninstall} disabled={!selected.size}>
          Uninstall selected
        </Button>
      </ViewHead>

      <div className="split">
        <Panel>
          <div className="table-wrap" style={{ maxHeight: "calc(100vh - 240px)" }}>
            <table className="data">
              <thead>
                <tr>
                  <th></th>
                  <th>Application</th>
                  <th>Publisher</th>
                  <th>Version</th>
                  <th>Size</th>
                  <th>Arch</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className={selected.has(a.id) ? "selected" : ""}>
                    <td>
                      <input
                        className="check"
                        type="checkbox"
                        checked={selected.has(a.id)}
                        onChange={() => toggle(a.id)}
                      />
                    </td>
                    <td>
                      <div className="app-row">
                        {a.iconBase64 ? (
                          <img className="app-icon" src={a.iconBase64} alt="" />
                        ) : (
                          <div className="app-icon fallback">{a.name.slice(0, 1)}</div>
                        )}
                        <div>
                          <div>{a.name}</div>
                          <div className="mono path" style={{ color: "var(--ink-mute)", fontSize: 11 }}>
                            {a.installLocation ?? a.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{a.publisher ?? "—"}</td>
                    <td className="mono">{a.version ?? "—"}</td>
                    <td className="mono">
                      {a.estimatedSizeBytes != null ? formatBytes(a.estimatedSizeBytes) : "—"}
                    </td>
                    <td>
                      <Chip>{a.architecture}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && !loading && <div className="empty">No applications matched.</div>}
          </div>
        </Panel>

        <Panel className="prediction" title="After uninstall">
          {prediction ? (
            <>
              <div className="big">{formatBytes(prediction.freeAfterBytes)}</div>
              <div className="sub">Free on {prediction.drive} after uninstall</div>
              <div className="reclaim-strip">
                <span>Estimated reclaim</span>
                <strong>{formatBytes(prediction.reclaimableBytes)}</strong>
              </div>
            </>
          ) : (
            <div className="empty">Select apps to estimate free space after uninstall.</div>
          )}
        </Panel>
      </div>
      {modal}
    </div>
  );
}
