import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { api } from "./lib/api";
import { useTelemetry } from "./lib/telemetry";
import type { AdminStatus, ViewId } from "./types";
import { Button } from "./components/Button";
import { Chip } from "./components/Chip";
import { Icon, type IconName } from "./components/Icon";
import OverviewView from "./views/Overview";
import StorageView from "./views/Storage";
import CleanupView from "./views/Cleanup";
import TreemapView from "./views/Treemap";
import ProcessesView from "./views/Processes";
import PerformanceView from "./views/Performance";
import GpuView from "./views/Gpu";
import AppsView from "./views/Apps";
import ServicesView from "./views/Services";
import StartupView from "./views/Startup";
import SchedulerView from "./views/Scheduler";
import FirewallView from "./views/Firewall";
import NetworkView from "./views/Network";
import UsersView from "./views/Users";
import ControlView from "./views/Control";
import DiskAnalyzerView from "./views/DiskAnalyzer";
import SystemToolsView from "./views/SystemTools";
import "./App.css";

type AppWindow = {
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  close: () => Promise<void>;
};

function getAppWindow(): AppWindow | null {
  try {
    return getCurrentWindow();
  } catch {
    return null;
  }
}

const NAV: { id: ViewId; label: string; group: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", group: "Home", icon: "overview" },
  { id: "storage", label: "Storage", group: "Storage", icon: "storage" },
  { id: "treemap", label: "Disk Treemap", group: "Storage", icon: "treemap" },
  { id: "diskAnalyzer", label: "Disk Analyzer", group: "Storage", icon: "storage" },
  { id: "cleanup", label: "Temp & Junk", group: "Storage", icon: "cleanup" },
  { id: "apps", label: "Applications", group: "Storage", icon: "apps" },
  { id: "processes", label: "Processes", group: "Task Manager", icon: "processes" },
  { id: "performance", label: "Performance", group: "Task Manager", icon: "performance" },
  { id: "gpu", label: "GPU", group: "Task Manager", icon: "gpu" },
  { id: "services", label: "Services", group: "Task Manager", icon: "services" },
  { id: "startup", label: "Startup", group: "Task Manager", icon: "startup" },
  { id: "users", label: "Users", group: "Task Manager", icon: "users" },
  { id: "scheduler", label: "Task Scheduler", group: "System", icon: "scheduler" },
  { id: "firewall", label: "Firewall", group: "System", icon: "firewall" },
  { id: "network", label: "Network", group: "System", icon: "network" },
  { id: "systemTools", label: "System Tools", group: "System", icon: "control" },
  { id: "control", label: "Control Center", group: "System", icon: "control" },
];

export default function App() {
  const [view, setView] = useState<ViewId>("overview");
  const [admin, setAdmin] = useState<AdminStatus | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [clock, setClock] = useState(() => new Date());
  const { perf } = useTelemetry();

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => {
    api.adminStatus().then(setAdmin).catch(() => undefined);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, typeof NAV>();
    for (const item of NAV) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, []);

  const win = useMemo(() => getAppWindow(), []);
  const memPct = perf && perf.memoryTotal > 0 ? (perf.memoryUsed / perf.memoryTotal) * 100 : 0;
  const clockLabel = clock.toLocaleTimeString([], { hour12: false });

  return (
    <div className="app">
      <header className="titlebar" data-tauri-drag-region>
        <div className="titlebar-brand">
          <Icon name="brand" size={28} />
          <span>Kyrus Manager</span>
        </div>
        <div className="titlebar-meta">
          {admin && (
            <Chip tone={admin.elevated ? "safe" : "warn"}>
              {admin.elevated ? "Administrator" : "Not elevated"}
            </Chip>
          )}
          {perf && (
            <Chip>
              CPU {perf.cpuUsage.toFixed(0)}% · RAM {memPct.toFixed(0)}%
            </Chip>
          )}
          {!admin?.elevated && (
            <Button
              className="compact"
              onClick={() =>
                api
                  .relaunchAdmin()
                  .then(() => notify("Elevation requested"))
                  .catch((e) => notify(String(e)))
              }
            >
              Elevate
            </Button>
          )}
          <div className="win-btns">
            <button type="button" onClick={() => void win?.minimize()} title="Minimize">
              <Icon name="winMinus" size={18} />
            </button>
            <button type="button" onClick={() => void win?.toggleMaximize()} title="Maximize">
              <Icon name="winMaximize" size={18} />
            </button>
            <button type="button" className="close" onClick={() => void win?.close()} title="Close">
              <Icon name="winClose" size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar">
          <div className="nav-scroll">
            {groups.map(([group, items]) => (
              <div key={group} className="nav-group">
                <div className="nav-label">{group}</div>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item${view === item.id ? " active" : ""}`}
                    onClick={() => setView(item.id)}
                  >
                    <Icon name={item.icon} size={18} />
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="machine">
            <div className="machine-device">
              <Icon name="display" size={18} />
              <div className="machine-name">{admin?.computerName || perf?.hostname || "—"}</div>
            </div>
            <div className="machine-sub">
              {perf ? `${perf.osName}${perf.osVersion ? ` · ${perf.osVersion}` : ""}` : "Waiting for telemetry"}
            </div>
            <div className="machine-ver">Kyrus Manager  /  v0.2.0</div>
          </div>
        </aside>

        <div className="workspace">
          <main className="content">
            {view === "overview" && <OverviewView onNavigate={setView} notify={notify} />}
            {view === "storage" && <StorageView notify={notify} />}
          {view === "treemap" && <TreemapView notify={notify} />}
          {view === "diskAnalyzer" && <DiskAnalyzerView notify={notify} />}
          {view === "cleanup" && <CleanupView notify={notify} />}
          {view === "processes" && <ProcessesView notify={notify} />}
          {view === "performance" && <PerformanceView />}
          {view === "gpu" && <GpuView notify={notify} />}
          {view === "apps" && <AppsView notify={notify} />}
          {view === "services" && <ServicesView notify={notify} />}
          {view === "startup" && <StartupView notify={notify} />}
          {view === "scheduler" && <SchedulerView notify={notify} />}
          {view === "firewall" && <FirewallView notify={notify} />}
          {view === "network" && <NetworkView notify={notify} />}
          {view === "users" && <UsersView notify={notify} />}
          {view === "systemTools" && <SystemToolsView notify={notify} />}
          {view === "control" && <ControlView notify={notify} />}
          </main>
          <footer className="statusbar">
            <Icon name="shield" size={18} />
            <span>{admin?.elevated ? "Administrator access" : "Standard access"}</span>
            <span className="mute">Live telemetry · Local machine</span>
            <span className="status-clock mono">
              {clockLabel}  /  Local machine
            </span>
          </footer>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
