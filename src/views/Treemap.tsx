import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { formatBytes } from "../lib/format";
import type { DriveInfo, TreemapNode } from "../types";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };
type Rect = { x: number; y: number; w: number; h: number; node: TreemapNode };

function squarify(nodes: TreemapNode[], x: number, y: number, w: number, h: number): Rect[] {
  const total = nodes.reduce((s, n) => s + Math.max(n.sizeBytes, 1), 0) || 1;
  const rects: Rect[] = [];
  let cx = x;
  let cy = y;
  let rw = w;
  let rh = h;
  const items = [...nodes].sort((a, b) => b.sizeBytes - a.sizeBytes);

  for (const node of items) {
    const ratio = Math.max(node.sizeBytes, 1) / total;
    if (rw >= rh) {
      const ww = Math.max(8, rw * ratio);
      rects.push({ x: cx, y: cy, w: ww, h: rh, node });
      cx += ww;
      rw -= ww;
    } else {
      const hh = Math.max(8, rh * ratio);
      rects.push({ x: cx, y: cy, w: rw, h: hh, node });
      cy += hh;
      rh -= hh;
    }
  }
  return rects;
}

const COLORS = ["#217c68", "#427cac", "#b48736", "#667d96", "#176c5b", "#366f9d", "#8a6a3b", "#5d8a78"];

export default function TreemapView({ notify }: Props) {
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [root, setRoot] = useState("C:\\");
  const [tree, setTree] = useState<TreemapNode | null>(null);
  const [stack, setStack] = useState<string[]>(["C:\\"]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.drives().then((d) => {
      setDrives(d);
      if (d[0]) {
        setRoot(d[0].mountPoint);
        setStack([d[0].mountPoint]);
      }
    });
  }, []);

  const load = async (path: string) => {
    setLoading(true);
    try {
      const node = await api.treemap(path, 28, 2);
      setTree(node);
      setRoot(path);
    } catch (e) {
      notify(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (root) void load(root);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rects = useMemo(() => {
    if (!tree?.children?.length) return [] as Rect[];
    return squarify(tree.children, 0, 0, 1000, 560);
  }, [tree]);

  const drill = (node: TreemapNode) => {
    if (!node.isDir) return;
    setStack((s) => [...s, node.path]);
    void load(node.path);
  };

  const up = () => {
    if (stack.length <= 1) return;
    const next = stack.slice(0, -1);
    setStack(next);
    void load(next[next.length - 1]);
  };

  return (
    <div className="view">
      <ViewHead
        title="Disk Treemap"
        subtitle="Visual space map — largest folders dominate. Double-click a block to drill in."
      >
        <Field label="Drive">
          <select
            value={drives.find((d) => root.startsWith(d.mountPoint))?.mountPoint ?? root}
            onChange={(e) => {
              setStack([e.target.value]);
              void load(e.target.value);
            }}
          >
            {drives.map((d) => (
              <option key={d.mountPoint} value={d.mountPoint}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Button onClick={up} disabled={stack.length <= 1}>
          Up
        </Button>
        <Button variant="primary" disabled={loading} onClick={() => load(root)}>
          {loading ? "Mapping…" : "Refresh"}
        </Button>
      </ViewHead>

      <Panel>
        <div className="mono path foot-note" style={{ marginTop: 0, marginBottom: 12 }}>
          {root} · {tree ? formatBytes(tree.sizeBytes) : "—"}
        </div>
        <svg className="treemap" viewBox="0 0 1000 560" role="img">
          {rects.map((r, i) => (
            <g
              key={r.node.path}
              onDoubleClick={() => drill(r.node)}
              style={{ cursor: r.node.isDir ? "pointer" : "default" }}
            >
              <rect
                x={r.x + 1}
                y={r.y + 1}
                width={Math.max(0, r.w - 2)}
                height={Math.max(0, r.h - 2)}
                rx={8}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.34}
                stroke={COLORS[i % COLORS.length]}
                strokeOpacity={0.7}
              />
              {r.w > 70 && r.h > 36 && (
                <>
                  <text x={r.x + 12} y={r.y + 24} fill="#292f2d" fontSize="13" fontWeight="600">
                    {r.node.name.slice(0, Math.floor(r.w / 9))}
                  </text>
                  <text x={r.x + 12} y={r.y + 42} fill="#62665f" fontSize="11">
                    {formatBytes(r.node.sizeBytes)}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>
        {!rects.length && !loading && <div className="empty">No treemap data yet.</div>}
      </Panel>
    </div>
  );
}
