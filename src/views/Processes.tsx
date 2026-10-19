import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { formatBytes } from "../lib/format";
import type { ProcessInfo } from "../types";
import { Button } from "../components/Button";
import { useConfirm } from "../components/ConfirmModal";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function ProcessesView({ notify }: Props) {
  const [list, setList] = useState<ProcessInfo[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sort, setSort] = useState<"cpu" | "mem" | "name">("cpu");
  const { ask, modal } = useConfirm();

  useEffect(() => {
    const tick = () =>
      api
        .processes()
        .then(setList)
        .catch((e) => notify(String(e)));
    tick();
    const id = window.setInterval(tick, 1500);
    return () => window.clearInterval(id);
  }, [notify]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = list;
    if (q) {
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.pid).includes(q) ||
          (p.path ?? "").toLowerCase().includes(q),
      );
    }
    rows = [...rows].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "mem") return b.memoryBytes - a.memoryBytes;
      return b.cpuUsage - a.cpuUsage;
    });
    return rows;
  }, [list, query, sort]);

  const toggle = (pid: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  const endTasks = async () => {
    const pids = [...selected];
    if (!pids.length) return;
    const ok = await ask({
      title: "End tasks",
      message: `End ${pids.length} process(es)? Unsaved work in those apps will be lost.`,
      confirmLabel: "End task",
    });
    if (!ok) return;
    for (const pid of pids) {
      try {
        await api.killProcess(pid);
      } catch (e) {
        notify(`${pid}: ${String(e)}`);
      }
    }
    setSelected(new Set());
    notify("End task requested");
  };

  return (
    <div className="view">
      <ViewHead
        title="Processes"
        subtitle="Task Manager replacement — live CPU, memory, disk I/O, paths, and admin kill controls."
      >
        <Field label="Search">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or PID" />
        </Field>
        <Field label="Sort">
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="cpu">CPU</option>
            <option value="mem">Memory</option>
            <option value="name">Name</option>
          </select>
        </Field>
        <Button variant="danger" onClick={endTasks} disabled={!selected.size}>
          End task
        </Button>
      </ViewHead>

      <Panel>
        <div className="table-wrap" style={{ maxHeight: "calc(100vh - 220px)" }}>
          <table className="data">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>PID</th>
                <th>CPU</th>
                <th>Memory</th>
                <th>Disk R/W</th>
                <th>Status</th>
                <th>Path</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 400).map((p) => (
                <tr key={p.pid} className={selected.has(p.pid) ? "selected" : ""}>
                  <td>
                    <input
                      className="check"
                      type="checkbox"
                      checked={selected.has(p.pid)}
                      onChange={() => toggle(p.pid)}
                    />
                  </td>
                  <td>{p.name}</td>
                  <td className="mono">{p.pid}</td>
                  <td className="mono">{p.cpuUsage.toFixed(1)}%</td>
                  <td className="mono">{formatBytes(p.memoryBytes)}</td>
                  <td className="mono">
                    {formatBytes(p.diskReadBytes)} / {formatBytes(p.diskWriteBytes)}
                  </td>
                  <td>{p.status}</td>
                  <td className="path mono">{p.path ?? "—"}</td>
                  <td>
                    <select
                      className="priority-select"
                      defaultValue="normal"
                      onChange={(e) =>
                        api
                          .setPriority(p.pid, e.target.value)
                          .then(() => notify(`Priority set for ${p.name}`))
                          .catch((err) => notify(String(err)))
                      }
                    >
                      <option value="idle">Low</option>
                      <option value="below_normal">Below</option>
                      <option value="normal">Normal</option>
                      <option value="above_normal">Above</option>
                      <option value="high">High</option>
                    </select>
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
