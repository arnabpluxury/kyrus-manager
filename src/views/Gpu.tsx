import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatBytes } from "../lib/format";
import type { GpuInfo, NvidiaGpu } from "../types";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Panel } from "../components/Panel";
import { StatCard } from "../components/StatCard";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function GpuView({ notify }: Props) {
  const [gpus, setGpus] = useState<GpuInfo[]>([]);
  const [nvidia, setNvidia] = useState<{ available: boolean; gpus: NvidiaGpu[] } | null>(null);

  const load = async () => {
    try {
      setGpus(await api.gpus());
      setNvidia(await api.nvidia());
    } catch (e) {
      notify(String(e));
    }
  };

  useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      api.nvidia().then(setNvidia).catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="view">
      <ViewHead title="GPU" subtitle="Adapters via WMI plus live NVIDIA telemetry when nvidia-smi is present.">
        <Button onClick={load}>Refresh</Button>
        <Button
          variant="primary"
          onClick={() => api.runControl("nvidia-control").then(notify).catch((e) => notify(String(e)))}
        >
          NVIDIA Control Panel
        </Button>
        <Button onClick={() => api.runControl("dxdiag-gpu").then(notify).catch((e) => notify(String(e)))}>
          DXDiag
        </Button>
      </ViewHead>

      <div className="grid-cards">
        {gpus.map((g) => (
          <StatCard
            key={g.name}
            label={g.vendor}
            value={g.name}
            icon={<Icon name="graphics" size={18} />}
            sub={
              <>
                Driver {g.driverVersion ?? "—"}
                <br />
                VRAM {g.adapterRamBytes != null ? formatBytes(g.adapterRamBytes) : "—"}
                <br />
                Status {g.status ?? "—"}
              </>
            }
          />
        ))}
        {!gpus.length && <div className="empty">No GPUs reported.</div>}
      </div>

      {nvidia?.available && (
        <Panel title="NVIDIA live">
          <div className="grid-cards" style={{ marginBottom: 0 }}>
            {nvidia.gpus.map((g) => (
              <StatCard
                key={g.index}
                plain
                label={`GPU ${g.index}`}
                value={g.name}
                meter={Number(g.utilizationGpu) || 0}
                meterTone="cpu"
                sub={
                  <>
                    Util {g.utilizationGpu ?? "—"}% · Mem {g.utilizationMem ?? "—"}%
                    <br />
                    VRAM {g.memoryUsed ?? "—"} / {g.memoryTotal ?? "—"} MiB
                    <br />
                    Temp {g.temperature ?? "—"}°C · Power {g.powerDraw ?? "—"} / {g.powerLimit ?? "—"} W
                    <br />
                    Fan {g.fanSpeed ?? "—"}% · Clock {g.clocksGraphics ?? "—"} MHz
                  </>
                }
              />
            ))}
          </div>
        </Panel>
      )}

      {nvidia && !nvidia.available && (
        <Panel>
          <div className="empty">nvidia-smi not available — showing WMI adapters only.</div>
        </Panel>
      )}
    </div>
  );
}
