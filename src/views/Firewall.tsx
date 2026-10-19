import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { FirewallProfile, FirewallRule } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { useConfirm } from "../components/ConfirmModal";
import { Field } from "../components/Field";
import { Icon } from "../components/Icon";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function FirewallView({ notify }: Props) {
  const [profiles, setProfiles] = useState<FirewallProfile[]>([]);
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [query, setQuery] = useState("");
  const { ask, modal } = useConfirm();

  const load = async () => {
    try {
      setProfiles(await api.firewallProfiles());
      setRules(await api.firewallRules(250));
    } catch (e) {
      notify(String(e));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = rules.filter((r) =>
    !query.trim() ? true : `${r.name} ${r.direction} ${r.action}`.toLowerCase().includes(query.toLowerCase()),
  );

  const setState = async (profile: FirewallProfile, enable: boolean) => {
    if (!enable) {
      const ok = await ask({
        title: "Turn firewall off",
        message: `Disable the ${profile.name} profile?`,
        confirmLabel: "Turn off",
      });
      if (!ok) return;
    }
    try {
      const msg = await api.firewallSetState(profile.name.split(/\s+/)[0] || "all", enable);
      notify(msg);
      await load();
    } catch (e) {
      notify(String(e));
    }
  };

  return (
    <div className="view">
      <ViewHead title="Firewall" subtitle="Domain / Private / Public profiles and rule inventory via netsh advfirewall.">
        <Button onClick={load}>Refresh</Button>
        <Button onClick={() => api.runControl("wf-advanced").then(notify).catch((e) => notify(String(e)))}>
          Advanced Firewall
        </Button>
      </ViewHead>

      <div className="grid-cards">
        {profiles.map((p) => (
          <div key={p.name} className="stat-card panel">
            <div className="stat-top">
              <div className="label">{p.name}</div>
              <span className="icon-well">
                <Icon name="shield" size={18} />
              </span>
            </div>
            <div className="value" style={{ fontSize: 20 }}>
              {p.state}
            </div>
            <div className="sub">
              In {p.inbound} · Out {p.outbound}
            </div>
            <div className="toolbar" style={{ marginTop: 10 }}>
              <Button className="compact" variant="primary" onClick={() => setState(p, true)}>
                On
              </Button>
              <Button className="compact" variant="danger" onClick={() => setState(p, false)}>
                Off
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Panel title="Rules">
        <div className="toolbar spaced">
          <Field label="Search rules">
            <input value={query} onChange={(e) => setQuery(e.target.value)} />
          </Field>
        </div>
        <div className="table-wrap" style={{ maxHeight: "calc(100vh - 460px)" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Enabled</th>
                <th>Direction</th>
                <th>Profiles</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={`${r.name}-${i}`}>
                  <td className="path">{r.name}</td>
                  <td>{r.enabled}</td>
                  <td>{r.direction}</td>
                  <td>{r.profiles}</td>
                  <td>
                    <Chip tone={/allow/i.test(r.action) ? "safe" : "caution"}>{r.action}</Chip>
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
