import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useBusy } from "../lib/busy";
import { formatBytes } from "../lib/format";
import type { DriveInfo, SpacePrediction, StorageEntry, StorageScanResult } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { useConfirm } from "../components/ConfirmModal";
import { Field } from "../components/Field";
import { Meter } from "../components/Meter";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function StorageView({ notify }: Props) {
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [root, setRoot] = useState("C:\\");
  const [scan, setScan] = useState<StorageScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("size");
  const [minMb, setMinMb] = useState("0");
  const [category, setCategory] = useState("All");
  const [deep, setDeep] = useState(true);
  const [prediction, setPrediction] = useState<SpacePrediction | null>(null);
  const [pathStack, setPathStack] = useState<string[]>(["C:\\"]);
  const { ask, modal } = useConfirm();
  const busy = useBusy();

  useEffect(() => {
    api.drives().then((d) => {
      setDrives(d);
      if (d[0]) {
        setRoot(d[0].mountPoint);
        setPathStack([d[0].mountPoint]);
      }
    });
  }, []);

  const runScan = async (target = root, deepScan = deep) => {
    if (loading) return;
    setLoading(true);
    busy.begin("storage", deepScan ? "Deep storage scan" : "Quick storage scan");
    try {
      const result = await api.scanStorage({
        root: target,
        maxDepth: 2,
        maxEntries: 5000,
        minSizeBytes: Math.max(0, Number(minMb) || 0) * 1024 * 1024,
        sortBy,
        sortDesc: true,
        category: category === "All" ? null : category,
        deep: deepScan,
      });
      setScan(result);
      setRoot(target);
      setSelected(new Set());
      setPrediction(null);
      if (deepScan && result.totalScannedBytes < 1024 * 1024 * 1024) {
        notify("Deep scan finished — if totals still look small, elevate as Administrator and rescan.");
      } else {
        notify(`Scan done · ${formatBytes(result.totalScannedBytes)} in ${result.elapsedMs} ms`);
      }
    } catch (e) {
      notify(String(e));
    } finally {
      busy.end("storage");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (root) void runScan(root, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    scan?.entries.forEach((e) => set.add(e.category));
    return [...set];
  }, [scan]);

  const toggle = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const predict = async () => {
    const paths = [...selected];
    if (!paths.length) {
      notify("Select items to predict reclaimable space");
      return;
    }
    try {
      setPrediction(await api.predictSpace({ paths }));
    } catch (e) {
      notify(String(e));
    }
  };

  const deleteSelected = async () => {
    const paths = [...selected];
    if (!paths.length) return;
    const ok = await ask({
      title: "Delete items",
      message: `Permanently delete ${paths.length} item(s)? This cannot be undone.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    busy.begin("delete", `Removing ${paths.length} item(s)`);
    try {
      const result = await api.deletePaths(paths);
      notify(`Freed ${formatBytes(result.freedBytes)}; ${result.failed.length} failed`);
      await runScan(root);
    } catch (e) {
      notify(String(e));
    } finally {
      busy.end("delete");
    }
  };

  const openEntry = (entry: StorageEntry) => {
    if (!entry.isDir) {
      void api.revealInExplorer(entry.path).then(notify).catch((e) => notify(String(e)));
      return;
    }
    setPathStack((s) => [...s, entry.path]);
    void runScan(entry.path);
  };

  const goUp = () => {
    if (pathStack.length <= 1) return;
    const next = pathStack.slice(0, -1);
    setPathStack(next);
    void runScan(next[next.length - 1]);
  };

  const driveValue =
    root.length === 3 ? root : (drives.find((d) => root.startsWith(d.mountPoint))?.mountPoint ?? root);
  const activeDrive = drives.find((d) => d.mountPoint === driveValue);
  const accountedPct =
    scan?.driveUsedBytes && scan.driveUsedBytes > 0
      ? Math.min(100, (scan.totalScannedBytes / scan.driveUsedBytes) * 100)
      : 0;

  return (
    <div className="view">
      <ViewHead
        title="Storage"
        subtitle="Full recursive folder sizes — Steam, Program Files, Users, and every visible root entry. Elevate for System Volume Information / pagefile."
      >
        <Field label="Drive">
          <select
            value={driveValue}
            onChange={(e) => {
              setPathStack([e.target.value]);
              void runScan(e.target.value);
            }}
          >
            {drives.map((d) => (
              <option key={d.mountPoint} value={d.mountPoint}>
                {d.name} · {formatBytes(d.freeBytes)} free
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sort">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="size">Size</option>
            <option value="name">Name</option>
            <option value="modified">Modified</option>
            <option value="category">Category</option>
          </select>
        </Field>
        <Field label="Min MB">
          <input className="narrow" value={minMb} onChange={(e) => setMinMb(e.target.value)} />
        </Field>
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <label className="field-check">
          <input type="checkbox" checked={deep} onChange={(e) => setDeep(e.target.checked)} />
          Deep sizes
        </label>
        <Button
          variant="primary"
          disabled={loading}
          onClick={() => runScan(root, deep)}
        >
          {loading ? "Deep scanning…" : "Rescan"}
        </Button>
      </ViewHead>

      {activeDrive && (
        <Panel className="drive-summary" title="Volume capacity">
          <div className="drive-summary-grid">
            <div>
              <div className="kicker">Total</div>
              <div className="mono">{formatBytes(activeDrive.totalBytes)}</div>
            </div>
            <div>
              <div className="kicker">Used</div>
              <div className="mono">{formatBytes(activeDrive.usedBytes)}</div>
            </div>
            <div>
              <div className="kicker">Free</div>
              <div className="mono">{formatBytes(activeDrive.freeBytes)}</div>
            </div>
            <div>
              <div className="kicker">Accounted in this folder</div>
              <div className="mono">{scan ? formatBytes(scan.totalScannedBytes) : "—"}</div>
            </div>
          </div>
          <Meter value={activeDrive.usedPercent} tone="disk" />
          {scan?.unaccountedBytes != null && scan.unaccountedBytes > 50 * 1024 * 1024 && (
            <div className="sub" style={{ marginTop: 10 }}>
              About {formatBytes(scan.unaccountedBytes)} of used space is not listed here (
              {accountedPct.toFixed(0)}% accounted). Typical gaps: pagefile/hiberfil, System Volume
              Information, locked files, or other folders — run as Administrator and open each large
              folder. Inaccessible entries: {scan.inaccessibleCount ?? 0}.
            </div>
          )}
        </Panel>
      )}

      <div className="split">
        <Panel>
          <div className="toolbar spaced">
            <Button onClick={goUp} disabled={pathStack.length <= 1}>
              Up
            </Button>
            <span className="mono path">{root}</span>
            <Button onClick={predict} disabled={!selected.size}>
              Predict space
            </Button>
            <Button variant="danger" onClick={deleteSelected} disabled={!selected.size}>
              Delete selected
            </Button>
            <Button
              disabled={!selected.size}
              onClick={() => {
                const first = [...selected][0];
                if (first) void api.revealInExplorer(first).then(notify).catch((e) => notify(String(e)));
              }}
            >
              Reveal
            </Button>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>% of listed</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {scan?.entries.map((e) => {
                  const pct =
                    scan.totalScannedBytes > 0
                      ? ((e.sizeBytes / scan.totalScannedBytes) * 100).toFixed(1)
                      : "0";
                  return (
                    <tr
                      key={e.path}
                      className={selected.has(e.path) ? "selected" : ""}
                      onDoubleClick={() => openEntry(e)}
                    >
                      <td>
                        <input
                          className="check"
                          type="checkbox"
                          checked={selected.has(e.path)}
                          onChange={() => toggle(e.path)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={e.isDir ? "linkish" : "linkish file"}
                          onClick={() => openEntry(e)}
                        >
                          {e.name}
                        </button>
                      </td>
                      <td>
                        <Chip
                          tone={
                            e.category === "Games"
                              ? "safe"
                              : e.category === "System"
                                ? "warn"
                                : "neutral"
                          }
                        >
                          {e.category}
                        </Chip>
                      </td>
                      <td className="mono">{formatBytes(e.sizeBytes)}</td>
                      <td className="mono">{pct}%</td>
                      <td>{e.isDir ? "Folder" : (e.extension ?? "File")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!scan?.entries.length && !loading && (
              <div className="empty">No entries for this filter. Try Min MB = 0 and Deep sizes on.</div>
            )}
          </div>
          {scan && (
            <div className="foot-note">
              {scan.dirCount} folders · {scan.fileCount} files · {formatBytes(scan.totalScannedBytes)}{" "}
              listed · {scan.elapsedMs} ms
              {scan.deep ? " · deep" : " · shallow"}
              {scan.truncated ? " · truncated" : ""}
              {(scan.inaccessibleCount ?? 0) > 0 ? ` · ${scan.inaccessibleCount} inaccessible` : ""}
            </div>
          )}
        </Panel>

        <Panel className="prediction" title="Space after action">
          {prediction ? (
            <>
              <div className="big">{formatBytes(prediction.freeAfterBytes)} free</div>
              <div className="sub">
                Now free {formatBytes(prediction.currentFreeBytes)} on {prediction.drive} →{" "}
                {prediction.usedAfterPercent.toFixed(1)}% used
              </div>
              <div className="reclaim-strip">
                <span>Reclaim</span>
                <strong>{formatBytes(prediction.reclaimableBytes)}</strong>
              </div>
              <div className="table-wrap" style={{ marginTop: 14, maxHeight: 280 }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prediction.items.map((i) => (
                      <tr key={i.label}>
                        <td className="path">{i.label}</td>
                        <td className="mono">{formatBytes(i.bytes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty">
              Select folders (e.g. Steam, Downloads) then predict reclaim. Double-click a folder to
              drill in; double-click a file to reveal in Explorer.
            </div>
          )}
        </Panel>
      </div>
      {modal}
    </div>
  );
}
