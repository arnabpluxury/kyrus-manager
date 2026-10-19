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
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.displayName.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q),
    );
  }, [list, query]);

  const act = async (name: string, action: "start" | "stop") => {
    if (action === "stop") {
      const ok = await ask({
        title: "Stop service",
        message: `Stop “${name}”? Apps that depend on it may fail.`,
        confirmLabel: "Stop",
      });
      if (!ok) return;
    }
    try {
      const msg = await api.controlService(name, action);
      notify(msg);
      await load();
    } catch (e) {
      notify(String(e));
    }
  };

  return (
    <div className="view">
      <ViewHead title="Services" subtitle="Windows service inventory with start/stop — Task Manager Services, expanded.">
        <Field label="Search">
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
        </Field>
        <Button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </ViewHead>

      <Panel>
        <div className="table-wrap" style={{ maxHeight: "calc(100vh - 220px)" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Display name</th>
                <th>Service</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.name}>
                  <td>{s.displayName}</td>
                  <td className="mono">{s.name}</td>
                  <td>
                    <Chip tone={s.status === "Running" ? "safe" : "default"}>{s.status}</Chip>
                  </td>
                  <td>
                    <div className="toolbar">
                      <Button onClick={() => act(s.name, "start")}>Start</Button>
                      <Button variant="danger" onClick={() => act(s.name, "stop")}>
                        Stop
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
