import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { useBusy } from "../lib/busy";
import type { BloatItem, BloatScanResult } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { useConfirm } from "../components/ConfirmModal";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { StatCard } from "../components/StatCard";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

const severityTone = (s: string) => {
  if (s === "critical") return "danger" as const;
  if (s === "high") return "danger" as const;
  if (s === "medium") return "warn" as const;
  return "neutral" as const;
};

export default function BloatwareView({ notify }: Props) {
  const [result, setResult] = useState<BloatScanResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState("All");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const busy = useBusy();
  const { ask, modal } = useConfirm();

  const scan = async () => {
    if (loading) return;
    setLoading(true);
    busy.begin("bloatware", "Bloatware Free scan");
    try {
      const res = await api.scanBloatware();
      setResult(res);
      setSelected(new Set(res.items.filter((i) => i.severity === "high" || i.severity === "critical").map((i) => i.id)));
      notify(`Scan done · ${res.bloatCount} bloat · ${res.threatCount} threats · ${res.scannedPackages} packages`);
    } catch (e) {
      notify(String(e));
    } finally {
      busy.end("bloatware");
      setLoading(false);
    }
  };

  const items = useMemo(() => {
    let rows = result?.items ?? [];
    if (kind !== "All") rows = rows.filter((i) => i.kind === kind);
    const needle = q.trim().toLowerCase();
    if (needle) {
      rows = rows.filter((i) =>
        `${i.name} ${i.reason} ${i.publisher} ${i.kind}`.toLowerCase().includes(needle),
      );
    }
    return rows;
  }, [result, kind, q]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectVisible = () => setSelected(new Set(items.map((i) => i.id)));

  const removeSelected = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    const ok = await ask({
      title: "Remove selected items",
      message: `Permanently remove ${ids.length} item(s)? AppX packages and provisioned OEM apps will be uninstalled. Services will be stopped & disabled. Threats trigger a Defender quick scan. This requires admin for full effect.`,
      confirmLabel: "Remove",
    });
    if (!ok) return;
    busy.begin("bloatware", "Removing bloat / threats");
    try {
      const rows = await api.removeBloatItems(ids);
      const failed = rows.filter((r) => !r.ok);
      notify(
        failed.length
          ? `Done with ${failed.length} failure(s) — see toast details`
          : `Removed ${rows.length} item(s)`,
      );
      if (failed[0]) notify(failed[0].message);
      await scan();
    } catch (e) {
      notify(String(e));
      busy.end("bloatware");
    }
  };

  return (
    <div className="view">
      <ViewHead
        title="Bloatware Free"
        subtitle="Full-PC transparent scan — Store junk, provisioned OEM apps, Defender threats, and noisy services. Select → one-click remove with admin rights."
      >
        <Field label="Filter">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option>All</option>
            <option value="appx">AppX</option>
            <option value="provisioned">Provisioned</option>
            <option value="threat">Threats</option>
            <option value="service">Services</option>
          </select>
        </Field>
        <Field label="Search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or reason" />
        </Field>
        <Button variant="primary" onClick={scan} disabled={loading}>
          {loading ? "Scanning…" : "Scan PC"}
        </Button>
        <Button onClick={selectVisible} disabled={!items.length}>
          Select visible
        </Button>
        <Button variant="danger" onClick={removeSelected} disabled={!selected.size}>
          Uninstall / remediate ({selected.size})
        </Button>
        <Button onClick={() => api.relaunchAdmin().then(() => notify("Relaunching elevated…")).catch((e) => notify(String(e)))}>
          Elevate admin
        </Button>
      </ViewHead>

      {result && (
        <div className="grid-cards" style={{ marginBottom: 16 }}>
          <StatCard label="Packages scanned" value={String(result.scannedPackages)} />
          <StatCard label="Bloat flagged" value={String(result.bloatCount)} />
          <StatCard label="Threats" value={String(result.threatCount)} />
          <StatCard
            label="Elevation"
            value={result.elevated ? "Administrator" : "Limited"}
            sub={result.elevated ? "Full removal available" : "Elevate for OEM / services"}
          />
        </div>
      )}

      {result?.notes?.length ? (
        <Panel title="Transparency notes" subtitle="Every action is visible — nothing silent.">
          <ul className="note-list">
            {result.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel
        title="Findings"
        extra={<Chip tone={result?.threatCount ? "danger" : "neutral"}>{items.length} shown</Chip>}
      >
        <div className="table-wrap" style={{ maxHeight: "calc(100vh - 340px)" }}>
          <table className="data">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Kind</th>
                <th>Severity</th>
                <th>Why flagged</th>
                <th>Publisher</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i: BloatItem) => (
                <tr key={i.id} className={selected.has(i.id) ? "selected" : ""}>
                  <td>
                    <input
                      className="check"
                      type="checkbox"
                      checked={selected.has(i.id)}
                      onChange={() => toggle(i.id)}
                      disabled={!i.removable}
                    />
                  </td>
                  <td>
                    <div>{i.name}</div>
                    {i.path ? <div className="sub path mono">{i.path}</div> : null}
                  </td>
                  <td>
                    <Chip>{i.kind}</Chip>
                    {i.provisioned ? <Chip tone="warn">provisioned</Chip> : null}
                  </td>
                  <td>
                    <Chip tone={severityTone(i.severity)}>{i.severity}</Chip>
                  </td>
                  <td>{i.reason}</td>
                  <td className="path">{i.publisher || "—"}</td>
                  <td className="mono">{i.version || i.details || "—"}</td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={7} className="empty">
                    {result ? "No items for this filter — run a fresh scan or clear filters." : "Run Scan PC to begin."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      {modal}
    </div>
  );
}
