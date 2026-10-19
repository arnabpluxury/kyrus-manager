import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { ControlAction } from "../types";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

const GROUP_ORDER = [
  "Settings",
  "Hardware",
  "Security",
  "Diagnostics",
  "Network",
  "Storage",
  "Power",
  "Legacy",
  "GPU",
];

export default function ControlView({ notify }: Props) {
  const [actions, setActions] = useState<ControlAction[]>([]);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");

  useEffect(() => {
    api.controlCatalog().then(setActions).catch((e) => notify(String(e)));
  }, [notify]);

  const availableGroups = useMemo(() => {
    const names = new Set(actions.map((a) => a.group));
    return ["All", ...GROUP_ORDER.filter((g) => names.has(g)), ...[...names].filter((g) => !GROUP_ORDER.includes(g))];
  }, [actions]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, ControlAction[]>();
    for (const action of actions) {
      if (group !== "All" && action.group !== group) continue;
      if (q && !`${action.title} ${action.description} ${action.group}`.toLowerCase().includes(q)) continue;
      const list = map.get(action.group) ?? [];
      list.push(action);
      map.set(action.group, list);
    }
    const ordered = GROUP_ORDER.filter((g) => map.has(g)).map((g) => [g, map.get(g)!] as const);
    for (const [g, items] of map) {
      if (!GROUP_ORDER.includes(g)) ordered.push([g, items]);
    }
    return ordered;
  }, [actions, query, group]);

  const run = async (id: string) => {
    try {
      notify(await api.runControl(id));
    } catch (e) {
      notify(String(e));
    }
  };

  return (
    <div className="view">
      <ViewHead
        title="Control Center"
        subtitle={`${actions.length} tools across ${availableGroups.length - 1} groups — Settings, Hardware, Security, Diagnostics, Network, Storage, Power, Legacy, GPU.`}
      >
        <Field label="Search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Settings, tools, diagnostics"
          />
        </Field>
        <Field label="Group">
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            {availableGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
      </ViewHead>

      {groups.map(([groupName, items]) => (
        <section key={groupName} className="group-block">
          <div className="group-label">
            {groupName} · {items.length}
          </div>
          <div className="tile-grid">
            {items.map((a) => (
              <button key={a.id} type="button" className="stat-card panel" onClick={() => run(a.id)}>
                <div className="label">{a.group}</div>
                <div className="value" style={{ fontSize: 18, lineHeight: "24px" }}>
                  {a.title}
                </div>
                <div className="sub tile-desc">{a.description}</div>
              </button>
            ))}
          </div>
        </section>
      ))}
      {!groups.length && <div className="empty">No matching tools.</div>}
      {groups.length > 0 && (
        <div className="toolbar spaced">
          <Button className="compact" onClick={() => api.controlCatalog().then(setActions)}>
            Refresh catalog
          </Button>
        </div>
      )}
    </div>
  );
}
