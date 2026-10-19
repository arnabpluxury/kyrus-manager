import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatBytes } from "../lib/format";
import type { EventLogEntry, PowerPlan, SystemAbout, ViewId } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { StatCard } from "../components/StatCard";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void; onNavigate: (v: ViewId) => void };

const WINX = [
  { id: "winx-power", title: "Power Options", desc: "Plans, sleep, lid & display", view: null as ViewId | null, jump: "power" as const },
  { id: "winx-events", title: "Event Viewer", desc: "System / App / Security logs", view: null, jump: "events" as const },
  { id: "winx-system", title: "System", desc: "About this PC — specs shown here", view: null, jump: "system" as const },
  { id: "winx-devices", title: "Device Manager", desc: "PnP enable / disable in-app", view: "devices" as ViewId, jump: null },
  { id: "winx-ncpa", title: "Network Connections", desc: "Adapters + enable/disable", view: "network" as ViewId, jump: null },
  { id: "winx-disk", title: "Disk Management", desc: "Disks, partitions, volumes", view: "diskManager" as ViewId, jump: null },
  { id: "winx-compmgmt", title: "Computer Management", desc: "Services, scheduler, disks…", view: null, jump: "hub" as const },
];

export default function AdminConsoleView({ notify, onNavigate }: Props) {
  const [about, setAbout] = useState<SystemAbout | null>(null);
  const [plans, setPlans] = useState<PowerPlan[]>([]);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [log, setLog] = useState("System");
  const [level, setLevel] = useState("Warning");

  const load = async () => {
    try {
      setAbout(await api.systemAbout());
      setPlans(await api.powerPlans());
      setEvents(await api.eventLog(log, 80, level));
    } catch (e) {
      notify(String(e));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log, level]);

  return (
    <div className="view">
      <ViewHead
        title="Admin Console"
        subtitle="Win+X Power User tools — same functions as Windows, plus live in-app management. Nothing hidden."
      >
        <Button onClick={load}>Refresh</Button>
        <Button variant="primary" onClick={() => onNavigate("bloatware")}>
          Bloatware Free
        </Button>
      </ViewHead>

      <div className="tile-grid" style={{ marginBottom: 18 }}>
        {WINX.map((item) => (
          <button
            key={item.id}
            type="button"
            className="stat-card panel"
            onClick={() => {
              if (item.view) onNavigate(item.view);
              else if (item.jump === "hub") {
                onNavigate("services");
                notify("Computer Management hub — use Services, Scheduler, Disk Manager, Devices, Users");
              } else {
                document.getElementById(`winx-${item.jump}`)?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            <div className="label">Win+X</div>
            <div className="value" style={{ fontSize: 17, lineHeight: "22px" }}>
              {item.title}
            </div>
            <div className="sub tile-desc">{item.desc}</div>
          </button>
        ))}
      </div>

      <div id="winx-system" className="split">
        <Panel title="System · About this PC" extra={<Chip>live</Chip>}>
          {about ? (
            <div className="glance-list" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <StatCard label="PC name" value={about.computerName} />
              <StatCard label="User" value={about.userName} />
              <StatCard label="OS" value={about.osName} sub={`Build ${about.osBuild}`} />
              <StatCard label="Version" value={about.osVersion} />
              <StatCard label="CPU" value={about.processor} />
              <StatCard label="Memory" value={formatBytes(about.totalMemoryBytes)} />
              <StatCard label="Model" value={`${about.manufacturer} ${about.model}`} />
              <StatCard label="BIOS" value={about.biosVersion} sub={about.systemType} />
              <StatCard label="Domain" value={about.domain || "—"} />
              <StatCard label="Last boot" value={about.lastBoot} sub={`Installed ${about.installDate}`} />
            </div>
          ) : (
            <div className="empty">Loading system identity…</div>
          )}
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button onClick={() => api.runControl("winx-system").then(notify).catch((e) => notify(String(e)))}>
              Open Windows About
            </Button>
            <Button onClick={() => api.runControl("msinfo").then(notify).catch((e) => notify(String(e)))}>
              System Information
            </Button>
          </div>
        </Panel>

        <div id="winx-power">
        <Panel title="Power Options" extra={<Chip tone="safe">{plans.filter((p) => p.active).length ? "active plan" : ""}</Chip>}>
          <div className="tile-grid" style={{ gridTemplateColumns: "1fr" }}>
            {plans.map((p) => (
              <div key={p.guid} className="stat-card raised" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div className="value" style={{ fontSize: 15 }}>{p.name}</div>
                  <div className="sub mono">{p.guid}</div>
                </div>
                {p.active ? (
                  <Chip tone="safe">Active</Chip>
                ) : (
                  <Button
                    className="compact"
                    variant="primary"
                    onClick={() =>
                      api.setPowerPlan(p.guid).then((m) => { notify(m); void load(); }).catch((e) => notify(String(e)))
                    }
                  >
                    Activate
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button onClick={() => api.runControl("winx-power").then(notify).catch((e) => notify(String(e)))}>
              Classic Power Options
            </Button>
          </div>
        </Panel>
        </div>
      </div>

      <div id="winx-events">
      <Panel
        title="Event Viewer"
        extra={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Field label="Log">
              <select value={log} onChange={(e) => setLog(e.target.value)}>
                <option>System</option>
                <option>Application</option>
                <option>Security</option>
                <option>Setup</option>
              </select>
            </Field>
            <Field label="Level">
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="All">All</option>
                <option value="Warning">Warning+</option>
                <option value="Error">Error+</option>
              </select>
            </Field>
          </div>
        }
      >
        <div className="table-wrap" style={{ maxHeight: 360 }}>
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
                    <Chip tone={e.level.includes("Error") || e.level.includes("Critical") ? "danger" : "warn"}>
                      {e.level}
                    </Chip>
                  </td>
                  <td>{e.source}</td>
                  <td className="mono">{e.eventId}</td>
                  <td className="path">{e.message}</td>
                </tr>
              ))}
              {!events.length && (
                <tr>
                  <td colSpan={5} className="empty">
                    No events for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      </div>
    </div>
  );
}
