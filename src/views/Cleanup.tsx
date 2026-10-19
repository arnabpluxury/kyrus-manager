import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useBusy } from "../lib/busy";
import { formatBytes } from "../lib/format";
import type { SpacePrediction, TempCandidate } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { useConfirm } from "../components/ConfirmModal";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { StatCard } from "../components/StatCard";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function CleanupView({ notify }: Props) {
  const [items, setItems] = useState<TempCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [safeOnly, setSafeOnly] = useState(true);
  const [prediction, setPrediction] = useState<SpacePrediction | null>(null);
  const { ask, modal } = useConfirm();
  const busy = useBusy();

  const load = async () => {
    if (loading) return;
    setLoading(true);
    busy.begin("cleanup", "Temp & junk scan");
    try {
      const list = await api.discoverTemp();
      setItems(list);
      setSelected(new Set(list.filter((i) => i.safeToDelete).map((i) => i.path)));
    } catch (e) {
      notify(String(e));
    } finally {
      busy.end("cleanup");
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = items.filter((i) => (safeOnly ? i.safeToDelete : true));
  const selectedBytes = visible.filter((i) => selected.has(i.path)).reduce((a, b) => a + b.sizeBytes, 0);

  const toggle = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const predict = async () => {
    try {
      setPrediction(await api.predictSpace({ tempPaths: [...selected] }));
    } catch (e) {
      notify(String(e));
    }
  };

  const clean = async () => {
    const paths = [...selected];
    if (!paths.length) return;
    const ok = await ask({
      title: "Delete temp files",
      message: `Delete ${paths.length} temp/junk item(s)? This cannot be undone.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    busy.begin("delete", `Removing ${paths.length} temp item(s)`);
    try {
      const result = await api.deletePaths(paths);
      notify(`Cleanup freed ${formatBytes(result.freedBytes)}`);
      await load();
    } catch (e) {
      notify(String(e));
    } finally {
      busy.end("delete");
    }
  };

  return (
    <div className="view">
      <ViewHead title="Temp & Junk" subtitle="Detect Windows temp, update cache, crash dumps, and other reclaimable clutter.">
        <Field>
          <input
            className="check"
            type="checkbox"
            checked={safeOnly}
            onChange={(e) => setSafeOnly(e.target.checked)}
          />
          Safe targets only
        </Field>
        <Button onClick={load} disabled={loading}>
          {loading ? "Scanning…" : "Rescan"}
        </Button>
        <Button onClick={predict} disabled={!selected.size}>
          Predict
        </Button>
        <Button variant="danger" onClick={clean} disabled={!selected.size}>
          Delete selected
        </Button>
      </ViewHead>

      <div className="grid-cards">
        <StatCard label="Candidates" value={visible.length} />
        <StatCard label="Selected" value={selected.size} />
        <StatCard label="Selected size" value={formatBytes(selectedBytes)} />
        <StatCard label="After cleanup" value={prediction ? formatBytes(prediction.freeAfterBytes) : "—"} />
      </div>

      {prediction && (
        <div className="reclaim-strip" style={{ marginBottom: 12 }}>
          <span>Reclaim on {prediction.drive}</span>
          <strong>{formatBytes(prediction.reclaimableBytes)}</strong>
        </div>
      )}

      <Panel>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Category</th>
                <th>Age</th>
                <th>Size</th>
                <th>Safety</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((i) => (
                <tr key={i.path} className={selected.has(i.path) ? "selected" : ""}>
                  <td>
                    <input
                      className="check"
                      type="checkbox"
                      checked={selected.has(i.path)}
                      onChange={() => toggle(i.path)}
                    />
                  </td>
                  <td>
                    <div>{i.name}</div>
                    <div className="mono path" style={{ color: "var(--ink-mute)", fontSize: 11 }}>
                      {i.path}
                    </div>
                  </td>
                  <td>{i.category}</td>
                  <td>{i.ageDays}d</td>
                  <td className="mono">{formatBytes(i.sizeBytes)}</td>
                  <td>
                    <Chip tone={i.safeToDelete ? "safe" : "caution"}>{i.safeToDelete ? "Safe" : "Review"}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && !loading && <div className="empty">No temp candidates found.</div>}
        </div>
      </Panel>
      {modal}
    </div>
  );
}
