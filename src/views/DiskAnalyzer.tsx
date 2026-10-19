import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useBusy } from "../lib/busy";
import { formatBytes } from "../lib/format";
import type { DriveInfo, LargeFile } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function DiskAnalyzerView({ notify }: Props) {
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [root, setRoot] = useState("C:\\");
  const [minMb, setMinMb] = useState("100");
  const [limit, setLimit] = useState("200");
  const [files, setFiles] = useState<LargeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const busy = useBusy();

  useEffect(() => {
    api.drives().then((d) => {
      setDrives(d);
      if (d[0]) setRoot(d[0].mountPoint);
    });
  }, []);

  const scan = async () => {
    if (loading) return;
    setLoading(true);
    busy.begin("largest", "Disk analyzer");
    try {
      const rows = await api.largestFiles(
        root,
        Math.max(20, Number(limit) || 200),
        Math.max(1, Number(minMb) || 100) * 1024 * 1024,
      );
      setFiles(rows);
      notify(`Found ${rows.length} large files under ${root}`);
    } catch (e) {
      notify(String(e));
    } finally {
      busy.end("largest");
      setLoading(false);
    }
  };

  return (
    <div className="view">
      <ViewHead
        title="Disk Analyzer"
        subtitle="Find the largest individual files across a drive — ISOs, installers, game packages, VHDs, videos."
      >
        <Field label="Root">
          <select value={root} onChange={(e) => setRoot(e.target.value)}>
            {drives.map((d) => (
              <option key={d.mountPoint} value={d.mountPoint}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Min MB">
          <input className="narrow" value={minMb} onChange={(e) => setMinMb(e.target.value)} />
        </Field>
        <Field label="Limit">
          <input className="narrow" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </Field>
        <Button variant="primary" disabled={loading} onClick={scan}>
          {loading ? "Walking tree…" : "Find largest files"}
        </Button>
      </ViewHead>

      <Panel title="Largest files">
        <div className="table-wrap" style={{ maxHeight: "calc(100vh - 260px)" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Size</th>
                <th>Path</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.path}>
                  <td>{f.name}</td>
                  <td>
                    <Chip>{f.category}</Chip>
                  </td>
                  <td className="mono">{formatBytes(f.sizeBytes)}</td>
                  <td className="mono path">{f.path}</td>
                  <td>
                    <Button
                      className="compact"
                      onClick={() =>
                        api.revealInExplorer(f.path).then(notify).catch((e) => notify(String(e)))
                      }
                    >
                      Reveal
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!files.length && !loading && (
            <div className="empty">Run a scan to list the heaviest files on this volume.</div>
          )}
        </div>
      </Panel>
    </div>
  );
}
