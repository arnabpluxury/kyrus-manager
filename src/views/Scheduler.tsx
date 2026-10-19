import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { ScheduledTask } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { useConfirm } from "../components/ConfirmModal";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function SchedulerView({ notify }: Props) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { ask, modal } = useConfirm();

  const load = async () => {
    setLoading(true);
    try {
      setTasks(await api.scheduledTasks(500));
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
    if (!q) return tasks;
    return tasks.filter((t) => `${t.name} ${t.author} ${t.taskToRun} ${t.status}`.toLowerCase().includes(q));
  }, [tasks, query]);

  const runAction = (work: () => Promise<string>) => {
    work().then(notify).catch((e) => notify(String(e)));
  };

  const disable = async (name: string) => {
    const ok = await ask({
      title: "Disable task",
      message: `Disable “${name}”? It will not run until enabled again.`,
      confirmLabel: "Disable",
    });
    if (!ok) return;
    runAction(() => api.setScheduledTask(name, false));
  };

  const end = async (name: string) => {
    const ok = await ask({
      title: "End task",
      message: `End the running instance of “${name}”?`,
      confirmLabel: "End",
    });
    if (!ok) return;
    runAction(() => api.endScheduledTask(name));
  };

  return (
    <div className="view">
      <ViewHead title="Task Scheduler" subtitle="schtasks inventory — run, end, enable, disable without leaving Kyrus.">
        <Field label="Search">
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
        </Field>
        <Button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
        <Button onClick={() => api.runControl("task-scheduler").then(notify).catch((e) => notify(String(e)))}>
          Open console
        </Button>
      </ViewHead>

      <Panel>
        <div className="table-wrap" style={{ maxHeight: "calc(100vh - 220px)" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Next</th>
                <th>Last result</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.name}>
                  <td>
                    <div>{t.name}</div>
                    <div className="mono path" style={{ color: "var(--ink-mute)", fontSize: 11 }}>
                      {t.taskToRun}
                    </div>
                  </td>
                  <td>
                    <Chip tone={/ready|running/i.test(t.status) ? "safe" : "default"}>{t.status}</Chip>
                  </td>
                  <td className="mono">{t.nextRun}</td>
                  <td className="mono">{t.lastResult}</td>
                  <td>
                    <div className="toolbar">
                      <Button onClick={() => runAction(() => api.runScheduledTask(t.name))}>Run</Button>
                      <Button onClick={() => end(t.name)}>End</Button>
                      <Button onClick={() => runAction(() => api.setScheduledTask(t.name, true))}>Enable</Button>
                      <Button variant="danger" onClick={() => disable(t.name)}>
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
