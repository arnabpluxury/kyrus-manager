import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { ServiceInfo } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { useConfirm } from "../components/ConfirmModal";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function ServicesView({ notify }: Props) {
  const [list, setList] = useState<ServiceInfo[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const { ask, modal } = useConfirm();

  const load = async () => {
    setLoading(true);
    try {
      setList(await api.services());
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
    return list.filter((s) => {
      if (statusFilter !== "All" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.displayName.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q) ||
        (s.binaryPath ?? "").toLowerCase().includes(q)
      );
    });
  }, [list, query, statusFilter]);

  const act = async (
    name: string,
    action: "start" | "stop" | "restart" | "pause" | "continue" | "auto" | "manual" | "disabled",
    label: string,
  ) => {
    if (action === "stop" || action === "disabled" || action === "restart") {
      const ok = await ask({
        title: label,
        message: `${label} “${name}”? Dependent apps may be affected.`,
        confirmLabel: label,
      });
      if (!ok) return;
    }
    try {
      notify(await api.controlService(name, action));
      await load();
    } catch (e) {
      notify(String(e));
    }
  };

  return (
    <div className="view">
      <ViewHead
        title="Services"
        subtitle="Full Windows services console — icons from binaries, start/stop/restart/pause, startup type, paths always visible."
      >
        <Field label="Search">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, path, description" />
        </Field>
        <Field label="Status">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            <option>Running</option>
            <option>Stopped</option>
            <option>Paused</option>
          </select>
        </Field>
        <Button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
        <Button onClick={() => api.runControl("services-msc").then(notify).catch((e) => notify(String(e)))}>
          Classic MMC
        </Button>
      </ViewHead>

      <Panel extra={<Chip>{filtered.length} shown</Chip>}>
        <div className="table-wrap" style={{ maxHeight: "calc(100vh - 220px)" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Startup</th>
                <th>PID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.name}>
                  <td>
                    <div className="app-row">
                      {s.iconBase64 ? (
                        <img className="app-icon" src={s.iconBase64} alt="" />
                      ) : (
                        <div className="app-icon fallback">{(s.displayName || s.name).slice(0, 1)}</div>
                      )}
                      <div>
                        <div>{s.displayName || s.name}</div>
                        <div className="mono path" style={{ color: "var(--ink-mute)", fontSize: 11 }}>
                          {s.name}
                          {s.binaryPath ? ` · ${s.binaryPath}` : ""}
                        </div>
                        {s.description ? (
                          <div className="sub" style={{ fontSize: 11, maxWidth: 420 }}>
                            {s.description}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    <Chip tone={s.status === "Running" ? "safe" : s.status === "Paused" ? "warn" : "default"}>
                      {s.status}
                    </Chip>
                  </td>
                  <td>
                    <Chip>{s.startType}</Chip>
                  </td>
                  <td className="mono">{s.pid ?? "—"}</td>
                  <td>
                    <div className="toolbar" style={{ flexWrap: "wrap", gap: 4 }}>
                      <Button className="compact" onClick={() => act(s.name, "start", "Start")}>
                        Start
                      </Button>
                      <Button className="compact" variant="danger" onClick={() => act(s.name, "stop", "Stop")}>
                        Stop
                      </Button>
                      <Button className="compact" onClick={() => act(s.name, "restart", "Restart")}>
                        Restart
                      </Button>
                      <Button className="compact" onClick={() => act(s.name, "pause", "Pause")}>
                        Pause
                      </Button>
                      <Button className="compact" onClick={() => act(s.name, "continue", "Continue")}>
                        Continue
                      </Button>
                      <Button className="compact" onClick={() => act(s.name, "auto", "Automatic")}>
                        Auto
                      </Button>
                      <Button className="compact" onClick={() => act(s.name, "manual", "Manual")}>
                        Manual
                      </Button>
                      <Button className="compact" variant="danger" onClick={() => act(s.name, "disabled", "Disable")}>
                        Disable
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {modal}
    </div>
  );
}
