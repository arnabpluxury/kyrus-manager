import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { DeviceEntry } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { useConfirm } from "../components/ConfirmModal";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function DevicesView({ notify }: Props) {
  const [list, setList] = useState<DeviceEntry[]>([]);
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("All");
  const [problemsOnly, setProblemsOnly] = useState(false);
  const { ask, modal } = useConfirm();

  const load = async () => {
    try {
      setList(await api.devices(cls === "All" ? undefined : cls));
    } catch (e) {
      notify(String(e));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls]);

  const classes = useMemo(() => {
    const set = new Set<string>(["All"]);
    list.forEach((d) => d.class && set.add(d.class));
    return [...set].sort();
  }, [list]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.filter((d) => {
      if (problemsOnly && d.status.toLowerCase() === "ok" && !d.problem) return false;
      if (!needle) return true;
      return `${d.name} ${d.class} ${d.manufacturer} ${d.instanceId}`.toLowerCase().includes(needle);
    });
  }, [list, q, problemsOnly]);

  const toggle = async (d: DeviceEntry, enable: boolean) => {
    const ok = await ask({
      title: enable ? "Enable device" : "Disable device",
      message: `${enable ? "Enable" : "Disable"} “${d.name}”? Incorrect changes can break hardware until re-enabled.`,
      confirmLabel: enable ? "Enable" : "Disable",
    });
    if (!ok) return;
    try {
      notify(await api.setDeviceEnabled(d.instanceId, enable));
      void load();
    } catch (e) {
      notify(String(e));
    }
  };

  return (
    <div className="view">
      <ViewHead
        title="Device Manager"
        subtitle="devmgmt.msc replacement — every PnP device listed with status, class, and enable/disable (admin)."
      >
        <Field label="Search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, class, ID" />
        </Field>
        <Field label="Class">
          <select value={cls} onChange={(e) => setCls(e.target.value)}>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <label className="check-label">
          <input className="check" type="checkbox" checked={problemsOnly} onChange={(e) => setProblemsOnly(e.target.checked)} />
          Problems only
        </label>
        <Button onClick={load}>Refresh</Button>
        <Button onClick={() => api.runControl("winx-devices").then(notify).catch((e) => notify(String(e)))}>
          Open classic
        </Button>
      </ViewHead>

      <Panel extra={<Chip>{filtered.length} shown · {list.length} loaded</Chip>}>
        <div className="table-wrap" style={{ maxHeight: "calc(100vh - 230px)" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Status</th>
                <th>Manufacturer</th>
                <th>Present</th>
                <th>Problem</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 600).map((d) => (
                <tr key={d.instanceId}>
                  <td title={d.instanceId}>{d.name}</td>
                  <td>{d.class || "—"}</td>
                  <td>
                    <Chip tone={d.status.toLowerCase() === "ok" ? "safe" : "danger"}>{d.status}</Chip>
                  </td>
                  <td>{d.manufacturer || "—"}</td>
                  <td>{d.present ? "Yes" : "No"}</td>
                  <td className="mono">{d.problem || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button className="compact" onClick={() => toggle(d, true)}>
                        Enable
                      </Button>
                      <Button className="compact" variant="danger" onClick={() => toggle(d, false)}>
                        Disable
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="empty">
                    No devices match.
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
