import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatBytes } from "../lib/format";
import type { NetworkAdapter } from "../types";
import { Button } from "../components/Button";
import { useConfirm } from "../components/ConfirmModal";
import { Icon } from "../components/Icon";
import { Panel } from "../components/Panel";
import { StatCard } from "../components/StatCard";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function NetworkView({ notify }: Props) {
  const [adapters, setAdapters] = useState<NetworkAdapter[]>([]);
  const [ip, setIp] = useState<{ adapter: string; details: string }[]>([]);
  const { ask, modal } = useConfirm();

  const load = async () => {
    try {
      setAdapters(await api.networkAdapters());
      setIp(await api.ipconfig());
    } catch (e) {
      notify(String(e));
    }
  };

  useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      api.networkAdapters().then(setAdapters).catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  const renew = async () => {
    const ok = await ask({
      title: "Release and renew",
      message: "Release the current IP address and request a new one? Connections may drop briefly.",
      confirmLabel: "Release / Renew",
    });
    if (!ok) return;
    api.runControl("release-renew").then(notify).catch((e) => notify(String(e)));
  };

  return (
    <div className="view">
      <ViewHead title="Network" subtitle="Adapters, traffic counters, ipconfig details, DNS flush and renew.">
        <Button onClick={load}>Refresh</Button>
        <Button onClick={() => api.runControl("flush-dns").then(notify).catch((e) => notify(String(e)))}>
          Flush DNS
        </Button>
        <Button variant="danger" onClick={renew}>
          Release / Renew
        </Button>
        <Button onClick={() => api.runControl("winx-ncpa").then(notify).catch((e) => notify(String(e)))}>
          Connections (Win+X)
        </Button>
      </ViewHead>

      <div className="grid-cards">
        {adapters.map((a) => (
          <div key={a.name} className="stat-card panel">
            <StatCard
              plain
              label="Adapter"
              value={a.name}
              icon={<Icon name="networkNodes" size={18} />}
              sub={
                <>
                  ↓ {formatBytes(a.receivedBytes)} · ↑ {formatBytes(a.transmittedBytes)}
                  <br />
                  Packets {a.packetsReceived} / {a.packetsTransmitted}
                  <br />
                  Errors {a.errorsOnReceived} / {a.errorsOnTransmitted}
                </>
              }
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Button
                className="compact"
                onClick={async () => {
                  const ok = await ask({
                    title: "Enable adapter",
                    message: `Enable network adapter “${a.name}”?`,
                    confirmLabel: "Enable",
                  });
                  if (!ok) return;
                  api.setAdapterEnabled(a.name, true).then(notify).then(load).catch((e) => notify(String(e)));
                }}
              >
                Enable
              </Button>
              <Button
                className="compact"
                variant="danger"
                onClick={async () => {
                  const ok = await ask({
                    title: "Disable adapter",
                    message: `Disable “${a.name}”? You may lose connectivity.`,
                    confirmLabel: "Disable",
                  });
                  if (!ok) return;
                  api.setAdapterEnabled(a.name, false).then(notify).then(load).catch((e) => notify(String(e)));
                }}
              >
                Disable
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Panel title="ipconfig">
        <div className="table-wrap" style={{ maxHeight: "calc(100vh - 420px)" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Section</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {ip.map((e) => (
                <tr key={e.adapter}>
                  <td>{e.adapter}</td>
                  <td>
                    <pre className="ip-pre">{e.details}</pre>
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
