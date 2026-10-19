import { formatBytes, formatPercent, formatRate, formatUptime } from "../lib/format";
import { useTelemetry, windowSamples } from "../lib/telemetry";
import { AreaChart } from "../components/AreaChart";
import { Button } from "../components/Button";
import { Panel } from "../components/Panel";
import { StatCard } from "../components/StatCard";
import { ViewHead } from "../components/ViewHead";
import { Icon } from "../components/Icon";

export default function PerformanceView() {
  const { perf, history, paused, setPaused, rangeSec, setRangeSec } = useTelemetry();
  const samples = windowSamples(history, rangeSec, paused);

  if (!perf) {
    return <div className="empty">Collecting performance samples…</div>;
  }

  const memPct = perf.memoryTotal > 0 ? (perf.memoryUsed / perf.memoryTotal) * 100 : 0;

  return (
    <div className="view">
      <ViewHead
        title="Performance"
        subtitle={`${perf.cpuBrand} · ${perf.cpuCores} cores${perf.frequencyMhz ? ` · ${perf.frequencyMhz} MHz` : ""}`}
      >
        <Button onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}</Button>
        <Button variant={rangeSec === 30 ? "primary" : "default"} onClick={() => setRangeSec(30)}>
          30s
        </Button>
        <Button variant={rangeSec === 60 ? "primary" : "default"} onClick={() => setRangeSec(60)}>
          60s
        </Button>
      </ViewHead>

      <div className="grid-cards">
        <StatCard
          label="CPU"
          value={formatPercent(perf.cpuUsage)}
          meter={perf.cpuUsage}
          meterTone="cpu"
          spark={samples.map((s) => s.cpu)}
          sparkColor="var(--color-cpu)"
          icon={<Icon name="cpu" size={18} />}
          well="cpu"
        />
        <StatCard
          label="Memory"
          value={formatPercent(memPct)}
          sub={`${formatBytes(perf.memoryUsed)} / ${formatBytes(perf.memoryTotal)} · avail ${formatBytes(perf.memoryAvailable)}`}
          meter={memPct}
          meterTone="memory"
          spark={samples.map((s) => s.memory)}
          sparkColor="var(--color-memory)"
          icon={<Icon name="memory" size={18} />}
        />
        <StatCard
          label="Disk I/O"
          value={formatRate(perf.diskReadBytesPerSec)}
          sub={`Write ${formatRate(perf.diskWriteBytesPerSec)}`}
          spark={samples.map((s) => s.diskRead)}
          sparkColor="var(--color-disk)"
          icon={<Icon name="storageMark" size={18} />}
        />
        <StatCard
          label="Network"
          value={`↓ ${formatRate(perf.networkRxBytesPerSec)}`}
          sub={`↑ ${formatRate(perf.networkTxBytesPerSec)}`}
          spark={samples.map((s) => s.netRx)}
          sparkColor="var(--color-network)"
          icon={<Icon name="networkNodes" size={18} />}
        />
      </div>

      <div className="chart-grid">
        <Panel title={`CPU · ${rangeSec}s`}>
          <AreaChart
            yMax={100}
            formatTick={(n) => `${n.toFixed(0)}%`}
            series={[{ label: "CPU", color: "var(--color-cpu)", values: samples.map((s) => s.cpu) }]}
          />
        </Panel>
        <Panel title={`Memory · ${rangeSec}s`}>
          <AreaChart
            yMax={100}
            formatTick={(n) => `${n.toFixed(0)}%`}
            series={[{ label: "Memory", color: "var(--color-memory)", values: samples.map((s) => s.memory) }]}
          />
        </Panel>
        <Panel title={`Disk · ${rangeSec}s`}>
          <AreaChart
            formatTick={(n) => formatRate(n)}
            series={[
              { label: "Read", color: "var(--color-disk)", values: samples.map((s) => s.diskRead) },
              { label: "Write", color: "var(--accent-2)", values: samples.map((s) => s.diskWrite) },
            ]}
          />
        </Panel>
        <Panel title={`Network · ${rangeSec}s`}>
          <AreaChart
            formatTick={(n) => formatRate(n)}
            series={[
              { label: "Down", color: "var(--color-network)", values: samples.map((s) => s.netRx) },
              { label: "Up", color: "var(--accent)", values: samples.map((s) => s.netTx) },
            ]}
          />
        </Panel>
      </div>

      <Panel>
        <div className="grid-cards" style={{ marginBottom: 0 }}>
          <StatCard plain label="Commit / Swap" value={`${formatBytes(perf.swapUsed)} / ${formatBytes(perf.swapTotal)}`} />
          <StatCard plain label="Processes" value={perf.processCount} />
          <StatCard plain label="Uptime" value={formatUptime(perf.uptimeSeconds)} />
          <StatCard plain label="Host" value={perf.hostname} sub={`${perf.osName} ${perf.osVersion}`} />
        </div>
      </Panel>
    </div>
  );
}
