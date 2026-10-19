import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatBytes } from "../lib/format";
import type { DiskInventory } from "../types";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { useConfirm } from "../components/ConfirmModal";
import { Meter } from "../components/Meter";
import { Panel } from "../components/Panel";
import { ViewHead } from "../components/ViewHead";

type Props = { notify: (m: string) => void };

export default function DiskManagerView({ notify }: Props) {
  const [inv, setInv] = useState<DiskInventory | null>(null);
  const { ask, modal } = useConfirm();

  const load = async () => {
    try {
      setInv(await api.diskInventory());
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
        title="Disk Management"
        subtitle="Native diskmgmt.msc replacement — disks, partitions, volumes. Online/offline & read-only controls (admin)."
      >
        <Button onClick={load}>Refresh</Button>
        <Button
          onClick={() =>
            api
              .rescanDisks()
              .then((m) => {
                notify(m);
                void load();
              })
              .catch((e) => notify(String(e)))
          }
        >
          Rescan disks
        </Button>
        <Button onClick={() => api.runControl("winx-disk").then(notify).catch((e) => notify(String(e)))}>
          Open classic
        </Button>
      </ViewHead>

      <Panel title="Physical disks" extra={<Chip>{inv?.disks.length ?? 0}</Chip>}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Size</th>
                <th>Bus</th>
                <th>Style</th>
                <th>Status</th>
                <th>Health</th>
                <th>Flags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(inv?.disks ?? []).map((d) => (
                <tr key={d.number}>
                  <td className="mono">{d.number}</td>
                  <td>{d.friendlyName}</td>
                  <td className="mono">{formatBytes(d.sizeBytes)}</td>
                  <td>{d.busType}</td>
                  <td>{d.partitionStyle}</td>
                  <td>{d.operationalStatus}</td>
                  <td>
                    <Chip tone={d.healthStatus.toLowerCase().includes("healthy") ? "safe" : "warn"}>
                      {d.healthStatus}
                    </Chip>
                  </td>
                  <td>
                    {d.isSystem && <Chip tone="caution">System</Chip>}{" "}
                    {d.isBoot && <Chip>Boot</Chip>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Button
                        className="compact"
                        onClick={async () => {
                          const ok = await ask({
                            title: "Set disk online",
                            message: `Bring Disk ${d.number} online?`,
                            confirmLabel: "Online",
                          });
                          if (!ok) return;
                          api
                            .setDiskOnline(d.number, true)
                            .then((m) => {
                              notify(m);
                              void load();
                            })
                            .catch((e) => notify(String(e)));
                        }}
                      >
                        Online
                      </Button>
                      <Button
                        className="compact"
                        variant="danger"
                        disabled={d.isSystem || d.isBoot}
                        onClick={async () => {
                          const ok = await ask({
                            title: "Set disk offline",
                            message: `Take Disk ${d.number} offline? System/boot disks are blocked.`,
                            confirmLabel: "Offline",
                          });
                          if (!ok) return;
                          api
                            .setDiskOnline(d.number, false)
                            .then((m) => {
                              notify(m);
                              void load();
                            })
                            .catch((e) => notify(String(e)));
                        }}
                      >
                        Offline
                      </Button>
                      <Button
                        className="compact"
                        onClick={() =>
                          api
                            .setDiskReadonly(d.number, true)
                            .then((m) => {
                              notify(m);
                              void load();
                            })
                            .catch((e) => notify(String(e)))
                        }
                      >
                        Read-only
                      </Button>
                      <Button
                        className="compact"
                        onClick={() =>
                          api
                            .setDiskReadonly(d.number, false)
                            .then((m) => {
                              notify(m);
                              void load();
                            })
                            .catch((e) => notify(String(e)))
                        }
                      >
                        Read-write
                      </Button>
                      <Button
                        className="compact"
                        disabled={d.isSystem || d.isBoot}
                        onClick={async () => {
                          const ok = await ask({
                            title: "Initialize disk (GPT)",
                            message: `Initialize Disk ${d.number} as GPT? Only use on blank / RAW disks — data loss if partitions exist.`,
                            confirmLabel: "Initialize GPT",
                          });
                          if (!ok) return;
                          api
                            .initializeDisk(d.number, "GPT")
                            .then((m) => {
                              notify(m);
                              void load();
                            })
                            .catch((e) => notify(String(e)));
                        }}
                      >
                        Init GPT
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="split">
        <Panel title="Partitions" extra={<Chip>{inv?.partitions.length ?? 0}</Chip>}>
          <div className="table-wrap" style={{ maxHeight: 320 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Disk</th>
                  <th>Part</th>
                  <th>Letter</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Flags</th>
                  <th>Letter</th>
                </tr>
              </thead>
              <tbody>
                {(inv?.partitions ?? []).map((p) => (
                  <tr key={`${p.diskNumber}-${p.partitionNumber}`}>
                    <td className="mono">{p.diskNumber}</td>
                    <td className="mono">{p.partitionNumber}</td>
                    <td className="mono">{p.driveLetter || "—"}</td>
                    <td className="mono">{formatBytes(p.sizeBytes)}</td>
                    <td>{p.partitionType}</td>
                    <td>
                      {p.isSystem && <Chip tone="caution">Sys</Chip>}{" "}
                      {p.isBoot && <Chip>Boot</Chip>}{" "}
                      {p.isActive && <Chip tone="safe">Active</Chip>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <Button
                          className="compact"
                          disabled={p.isSystem || p.isBoot}
                          onClick={async () => {
                            const letter = window.prompt("New drive letter (A–Z)", p.driveLetter || "Z");
                            if (!letter) return;
                            api
                              .assignDriveLetter(p.diskNumber, p.partitionNumber, letter)
                              .then((m) => {
                                notify(m);
                                void load();
                              })
                              .catch((e) => notify(String(e)));
                          }}
                        >
                          Assign
                        </Button>
                        <Button
                          className="compact"
                          variant="danger"
                          disabled={!p.driveLetter || p.isSystem || p.isBoot}
                          onClick={async () => {
                            const ok = await ask({
                              title: "Remove drive letter",
                              message: `Remove letter ${p.driveLetter}: from this partition?`,
                              confirmLabel: "Remove",
                            });
                            if (!ok) return;
                            api
                              .removeDriveLetter(p.diskNumber, p.partitionNumber)
                              .then((m) => {
                                notify(m);
                                void load();
                              })
                              .catch((e) => notify(String(e)));
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Volumes" extra={<Chip>{inv?.volumes.length ?? 0}</Chip>}>
          <div className="table-wrap" style={{ maxHeight: 320 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Letter</th>
                  <th>Label</th>
                  <th>FS</th>
                  <th>Used</th>
                  <th>Free</th>
                  <th>Health</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(inv?.volumes ?? []).map((v, i) => {
                  const used =
                    v.sizeBytes > 0 ? ((v.sizeBytes - v.freeBytes) / v.sizeBytes) * 100 : 0;
                  return (
                    <tr key={`${v.driveLetter}-${v.label}-${i}`}>
                      <td className="mono">{v.driveLetter ? `${v.driveLetter}:` : "—"}</td>
                      <td>{v.label || "—"}</td>
                      <td>{v.fileSystem || "—"}</td>
                      <td style={{ minWidth: 120 }}>
                        <Meter value={used} />
                      </td>
                      <td className="mono">{formatBytes(v.freeBytes)}</td>
                      <td>{v.healthStatus}</td>
                      <td>
                        {v.driveLetter ? (
                          <Button
                            className="compact"
                            onClick={() =>
                              api.openVolume(v.driveLetter).then(notify).catch((e) => notify(String(e)))
                            }
                          >
                            Open
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      {modal}
    </div>
  );
}
