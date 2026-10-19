import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { UserSession } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function UsersView({ notify }: Props) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [locals, setLocals] = useState<string[]>([]);

  const load = async () => {
    try {
      setSessions(await api.userSessions());
      setLocals(await api.localUsers());
    } catch (e) {
      notify(String(e));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="view">
      <ViewHead
        title="Users & Sessions"
        subtitle="Interactive sessions (quser) and local accounts — Task Manager Users, expanded."
      >
        <Button onClick={load}>Refresh</Button>
        <Button onClick={() => api.runControl("settings-accounts").then(notify).catch((e) => notify(String(e)))}>
          Accounts settings
        </Button>
      </ViewHead>

      <div className="split">
        <Panel title="Sessions">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Session</th>
                  <th>ID</th>
                  <th>State</th>
                  <th>Idle</th>
                  <th>Logon</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={`${s.username}-${s.id}`}>
                    <td>{s.username}</td>
                    <td>{s.sessionName}</td>
                    <td className="mono">{s.id}</td>
                    <td>
                      <Chip tone={/active/i.test(s.state) ? "safe" : "default"}>{s.state}</Chip>
                    </td>
                    <td>{s.idleTime}</td>
                    <td>{s.logonTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!sessions.length && <div className="empty">No sessions reported (needs interactive query user).</div>}
          </div>
        </Panel>
        <Panel title="Local users">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Account</th>
                </tr>
              </thead>
              <tbody>
                {locals.map((u) => (
                  <tr key={u}>
                    <td>{u}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!locals.length && <div className="empty">No local accounts reported.</div>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
