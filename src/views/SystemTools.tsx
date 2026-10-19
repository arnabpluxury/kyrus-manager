import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { EnvVar, EventEntry, PowerPlan } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function SystemToolsView({ notify }: Props) {
  const [env, setEnv] = useState<EnvVar[]>([]);
  const [plans, setPlans] = useState<PowerPlan[]>([]);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    try {
      setEnv(await api.envVars());
      setPlans(await api.powerPlans());
      setEvents(await api.recentErrors(100));
    } catch (e) {
      notify(String(e));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return env;
    return env.filter((e) => `${e.name} ${e.value}`.toLowerCase().includes(needle));
  }, [env, q]);

  return (
    <div className="view">
      <ViewHead
        title="System Tools"
        subtitle="Environment variables, power plans, and recent System log errors/warnings — native Windows controls."
      >
        <Button onClick={load}>Refresh</Button>
        <Button onClick={() => api.runControl("event-viewer").then(notify).catch((e) => notify(String(e)))}>
          Event Viewer
        </Button>
        <Button onClick={() => api.runControl("powercfg").then(notify).catch((e) => notify(String(e)))}>
          Power Options
        </Button>
      </ViewHead>

      <div className="split">
        <Panel title="Power plans">
          <div className="tile-grid" style={{ gridTemplateColumns: "1fr" }}>
            {plans.map((p) => (
              <div key={p.guid} className="stat-card raised" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="value" style={{ fontSize: 16, lineHeight: "22px" }}>
                    {p.name}
                  </div>
                  <div className="sub mono">{p.guid}</div>
                </div>
                {p.active ? (
                  <Chip tone="safe">Active</Chip>
                ) : (
                  <Button
                    className="compact"
                    variant="primary"
                    onClick={() =>
                      api
                        .setPowerPlan(p.guid)
                        .then((m) => {
                          notify(m);
                          void load();
                        })
                        .catch((e) => notify(String(e)))
                    }
                  >
                    Activate
                  </Button>
                )}
              </div>
            ))}
            {!plans.length && <div className="empty">No power plans returned.</div>}
          </div>
        </Panel>

        <Panel
          title="Recent System errors"
          extra={<Chip tone="warn">{events.length}</Chip>}
        >
          <div className="table-wrap" style={{ maxHeight: 320 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Level</th>
                  <th>Source</th>
                  <th>Id</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={`${e.time}-${e.eventId}-${i}`}>
                    <td className="mono">{e.time}</td>
                    <td>
                      <Chip tone={/error|critical/i.test(e.level) ? "danger" : "warn"}>{e.level}</Chip>
                    </td>
                    <td>{e.source}</td>
                    <td className="mono">{e.eventId}</td>
                    <td className="path">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!events.length && <div className="empty">No recent errors (or access denied).</div>}
          </div>
        </Panel>
      </div>

      <Panel
        title="Environment variables"
        extra={
          <Field label="Search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="PATH, TEMP…" />
          </Field>
        }
      >
        <div className="table-wrap" style={{ maxHeight: 360 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.name}>
                  <td className="mono">{e.name}</td>
                  <td className="mono path">{e.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
