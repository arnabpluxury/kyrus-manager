import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { StartupItem } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { useConfirm } from "../components/ConfirmModal";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function StartupView({ notify }: Props) {
  const [items, setItems] = useState<StartupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { ask, modal } = useConfirm();

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api.startup());
    } catch (e) {
      notify(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const disable = async (item: StartupItem) => {
    const ok = await ask({
      title: "Disable startup item",
      message: `Remove startup entry “${item.name}”?`,
      confirmLabel: "Disable",
    });
    if (!ok) return;
    try {
      await api.disableStartup(item.name, item.location);
      notify(`Removed ${item.name}`);
      await load();
    } catch (e) {
      notify(String(e));
    }
  };

  return (
    <div className="view">
      <ViewHead title="Startup" subtitle="Registry Run / RunOnce entries that launch with Windows.">
        <Button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </ViewHead>

      <Panel>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Command</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={`${i.location}:${i.name}`}>
                  <td>{i.name}</td>
                  <td>
                    <Chip>{i.location}</Chip>
                  </td>
                  <td className="mono path">{i.command}</td>
                  <td>
                    <Button variant="danger" onClick={() => disable(i)}>
                      Disable
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && !loading && <div className="empty">No startup entries found.</div>}
        </div>
      </Panel>
      {modal}
    </div>
  );
}
