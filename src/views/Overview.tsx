import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatBytes, formatPercent, formatRate, formatUptime } from "../lib/format";
import { useTelemetry, windowSamples } from "../lib/telemetry";
import type { DriveInfo, FirewallProfile, GpuInfo, NvidiaGpu, ViewId } from "../types";
import { AreaChart } from "../components/AreaChart";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { Icon } from "../components/Icon";
import { Meter } from "../components/Meter";
import { Panel } from "../components/Panel";
import { StatCard } from "../components/StatCard";
import { ViewHead } from "../components/ViewHead";

type Props = {
  onNavigate: (v: ViewId) => void;
  notify: (m: string) => void;
};

export default function OverviewView({ onNavigate, notify }: Props) {
  const { perf, history, paused } = useTelemetry();
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [gpus, setGpus] = useState<GpuInfo[]>([]);
  const [nvidia, setNvidia] = useState<NvidiaGpu[]>([]);
  const [firewall, setFirewall] = useState<FirewallProfile[]>([]);

  const loadExtras = () => {
    api.drives().then(setDrives).catch((e) => notify(String(e)));
    api.gpus().then(setGpus).catch(() => undefined);
    api
      .nvidia()
      .then((n) => setNvidia(n.gpus ?? []))
      .catch(() => undefined);
    api.firewallProfiles().then(setFirewall).catch(() => undefined);
  };

  useEffect(() => {
    loadExtras();
  }, [notify]);

  const samples = windowSamples(history, 60, paused);
  const memPct = perf && perf.memoryTotal > 0 ? (perf.memoryUsed / perf.memoryTotal) * 100 : 0;
  const systemDrive = drives.find((d) => d.mountPoint.toUpperCase().startsWith("C")) ?? drives[0];
  const gpuName = nvidia[0]?.name || gpus[0]?.name || "No GPU reported";
  const gpuTemp = nvidia[0]?.temperature;
  const isOn = (state: string) => /on|true|1|enable/i.test(state);
  const fwOk = firewall.length > 0 && firewall.every((p) => isOn(p.state));
  const fwLabel =
    firewall.length === 0
      ? "Profiles unavailable"
      : fwOk
        ? "All profiles protected"
        : `${firewall.filter((p) => isOn(p.state)).length}/${firewall.length} profiles on`;

  const driveTone = (pct: number, index: number): "cpu" | "memory" | "disk" => {
    if (pct >= 85) return "disk";
    if (index === 0) return "cpu";
    if (index === 1) return "memory";
    return "disk";
  };

  return (
    <div className="view">
      <ViewHead
        title="Control Center"
        subtitle={
          perf
            ? `${perf.hostname} · ${perf.osName} · ${perf.cpuBrand}`
            : "Loading system telemetry…"
        }
      >
        <Button onClick={() => onNavigate("processes")}>
          <Icon name="processes" size={18} />
          Open processes
        </Button>
        <Button variant="primary" onClick={() => onNavigate("storage")}>
          <Icon name="storage" size={18} />
          Analyze storage
        </Button>
      </ViewHead>

      <div className="grid-cards overview-stats">
        <StatCard
          label="CPU"
          value={perf ? formatPercent(perf.cpuUsage) : "—"}
          sub={
            perf
              ? `${perf.cpuCores} logical processors${perf.frequencyMhz ? ` · ${(perf.frequencyMhz / 1000).toFixed(2)} GHz` : ""}`
              : ""
          }
          spark={samples.map((s) => s.cpu)}
          sparkColor="var(--color-cpu)"
          icon={<Icon name="cpu" size={18} />}
          well="cpu"
        />
        <StatCard
          label="Memory"
          value={perf ? formatPercent(memPct) : "—"}
          sub={perf ? `${formatBytes(perf.memoryUsed)} / ${formatBytes(perf.memoryTotal)} in use` : ""}
          spark={samples.map((s) => s.memory)}
          sparkColor="var(--color-memory)"
          icon={<Icon name="memory" size={18} />}
        />
        <StatCard
          label="Processes"
          value={perf?.processCount ?? "—"}
          sub={perf ? `Uptime ${formatUptime(perf.uptimeSeconds)}` : ""}
          spark={samples.map((s) => s.cpu)}
          sparkColor="var(--color-disk)"
          icon={<Icon name="processesMark" size={18} />}
        />
        <StatCard
          label="Network"
          value={perf ? formatRate(perf.networkRxBytesPerSec + perf.networkTxBytesPerSec) : "—"}
          sub={perf ? `↓ Receiving · ↑ ${formatRate(perf.networkTxBytesPerSec)}` : ""}
          spark={samples.map((s) => s.netRx)}
          sparkColor="var(--color-network)"
          icon={<Icon name="networkPulse" size={18} />}
        />
      </div>

      <div className="glance">
        <Panel
          title="System activity"
          subtitle="CPU & memory · Last 60 seconds"
          extra={
            <div className="legend-chips">
              <Chip tone="safe">CPU {perf ? `${perf.cpuUsage.toFixed(0)}%` : "—"}</Chip>
              <Chip>Memory {perf ? `${memPct.toFixed(0)}%` : "—"}</Chip>
            </div>
          }
        >
          {samples.length ? (
            <AreaChart
              height={132}
              yMax={100}
              series={[
                { label: "CPU", color: "var(--color-cpu)", values: samples.map((s) => s.cpu) },
                { label: "Memory", color: "var(--color-memory)", values: samples.map((s) => s.memory) },
              ]}
              formatTick={(n) => `${n.toFixed(0)}`}
            />
          ) : (
            <div className="empty">Collecting activity samples…</div>
          )}
        </Panel>
        <Panel title="At a glance" subtitle="Your machine is running normally">
          <div className="glance-list compact">
            <button type="button" className="glance-item row" onClick={() => onNavigate("gpu")}>
              <Icon name="gpu" size={18} />
              <div>
                <div className="v">Graphics</div>
                <div className="kicker">
                  {gpuName}
                  {gpuTemp != null ? ` · ${gpuTemp}°C` : ""}
                </div>
              </div>
            </button>
            <button type="button" className="glance-item row" onClick={() => onNavigate("firewall")}>
              <Icon name="firewall" size={18} />
              <div>
                <div className="v">Firewall</div>
                <div className="kicker">{fwLabel}</div>
              </div>
            </button>
            <button type="button" className="glance-item row" onClick={() => onNavigate("storage")}>
              <Icon name="drive" size={18} />
              <div>
                <div className="v">Storage</div>
                <div className="kicker">
                  {systemDrive
                    ? `${formatBytes(systemDrive.freeBytes)} free on ${systemDrive.mountPoint.replace(/\\$/, "")}`
                    : "No drive reported"}
                </div>
              </div>
            </button>
          </div>
        </Panel>
      </div>

      <Panel
        title="Connected drives"
        subtitle="Live capacity · Choose a drive to explore"
        extra={
          <Button className="compact" onClick={loadExtras}>
            Refresh
          </Button>
        }
      >
        <div className="drive-row">
          {drives.map((d, i) => (
            <button
              key={d.mountPoint}
              type="button"
              className="drive-card"
              onClick={() => onNavigate("storage")}
            >
              <div className="drive-title">
                <Icon name="drive" size={18} />
                <span>{d.name || d.mountPoint}</span>
              </div>
              <div className="sub">
                {d.driveType} · {d.fileSystem}
              </div>
              <Meter value={d.usedPercent} tone={driveTone(d.usedPercent, i)} />
              <div className="sub">
                {formatBytes(d.freeBytes)} free of {formatBytes(d.totalBytes)}
              </div>
            </button>
          ))}
          {drives.length === 0 && <div className="empty">No drives detected yet.</div>}
        </div>
      </Panel>
    </div>
  );
}
