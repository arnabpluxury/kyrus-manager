import { invoke } from "@tauri-apps/api/core";
import type {
  AdminStatus,
  ControlAction,
  DriveInfo,
  FirewallProfile,
  FirewallRule,
  GpuInfo,
  EnvVar,
  EventEntry,
  InstalledApp,
  LargeFile,
  NetworkAdapter,
  NvidiaGpu,
  PerformanceSnapshot,
  PowerPlan,
  ProcessInfo,
  ScheduledTask,
  ServiceInfo,
  SpacePrediction,
  StartupItem,
  StorageScanResult,
  TempCandidate,
  TreemapNode,
  UserSession,
} from "../types";

export const api = {
  adminStatus: () => invoke<AdminStatus>("get_admin_status"),
  relaunchAdmin: () => invoke<void>("relaunch_admin"),
  drives: () => invoke<DriveInfo[]>("list_drives"),
  scanStorage: (options: Record<string, unknown>) =>
    invoke<StorageScanResult>("scan_storage", { options }),
  largestFiles: (root: string, limit = 200, minSizeBytes = 50 * 1024 * 1024) =>
    invoke<LargeFile[]>("find_largest_files", { root, limit, minSizeBytes }),
  revealInExplorer: (path: string) => invoke<string>("reveal_in_explorer", { path }),
  envVars: () => invoke<EnvVar[]>("list_env_vars"),
  powerPlans: () => invoke<PowerPlan[]>("list_power_plans"),
  setPowerPlan: (guid: string) => invoke<string>("set_power_plan", { guid }),
  recentErrors: (limit = 80) => invoke<EventEntry[]>("recent_system_errors", { limit }),
  deletePaths: (paths: string[]) =>
    invoke<{ deleted: string[]; failed: { path: string; error: string }[]; freedBytes: number }>(
      "delete_paths",
      { paths },
    ),
  discoverTemp: () => invoke<TempCandidate[]>("discover_temp"),
  processes: () => invoke<ProcessInfo[]>("list_processes"),
  killProcess: (pid: number) => invoke<void>("kill_process", { pid }),
  killProcesses: (pids: number[]) =>
    invoke<[number, { Ok?: null; Err?: string }][]>("kill_processes", { pids }),
  setPriority: (pid: number, className: string) =>
    invoke<void>("set_process_priority", { pid, class: className }),
  performance: () => invoke<PerformanceSnapshot>("get_performance"),
  apps: () => invoke<InstalledApp[]>("list_apps"),
  uninstallApp: (id: string, preferQuiet: boolean, autoAdvance: boolean) =>
    invoke<{ id: string; started: boolean; mode: string; message: string }>("uninstall_app", {
      id,
      preferQuiet,
      autoAdvance,
    }),
  uninstallApps: (ids: string[], preferQuiet: boolean, autoAdvance: boolean) =>
    invoke<{ id: string; started: boolean; mode: string; message: string }[]>("uninstall_apps", {
      ids,
      preferQuiet,
      autoAdvance,
    }),
  services: () => invoke<ServiceInfo[]>("list_services"),
  controlService: (name: string, action: string) =>
    invoke<string>("control_service", { name, action }),
  startup: () => invoke<StartupItem[]>("list_startup"),
  disableStartup: (name: string, location: string) =>
    invoke<void>("disable_startup", { name, location }),
  predictSpace: (request: {
    paths?: string[];
    appIds?: string[];
    tempPaths?: string[];
  }) => invoke<SpacePrediction>("predict_space", { request }),
  controlCatalog: () => invoke<ControlAction[]>("control_catalog"),
  runControl: (id: string) => invoke<string>("run_control_action", { id }),
  treemap: (root: string, maxChildren = 24, maxDepth = 2) =>
    invoke<TreemapNode>("build_treemap", { root, maxChildren, maxDepth }),
  gpus: () => invoke<GpuInfo[]>("list_gpus"),
  nvidia: () =>
    invoke<{ available: boolean; raw: string; gpus: NvidiaGpu[] }>("nvidia_snapshot"),
  firewallProfiles: () => invoke<FirewallProfile[]>("firewall_profiles"),
  firewallRules: (limit = 200) => invoke<FirewallRule[]>("firewall_rules", { limit }),
  firewallSetState: (profile: string, enable: boolean) =>
    invoke<string>("firewall_set_state", { profile, enable }),
  scheduledTasks: (limit = 400) => invoke<ScheduledTask[]>("list_scheduled_tasks", { limit }),
  runScheduledTask: (name: string) => invoke<string>("run_scheduled_task", { name }),
  endScheduledTask: (name: string) => invoke<string>("end_scheduled_task", { name }),
  setScheduledTask: (name: string, enable: boolean) =>
    invoke<string>("set_scheduled_task", { name, enable }),
  networkAdapters: () => invoke<NetworkAdapter[]>("list_network_adapters"),
  ipconfig: () =>
    invoke<{ adapter: string; details: string }[]>("ipconfig_all"),
  userSessions: () => invoke<UserSession[]>("list_user_sessions"),
  localUsers: () => invoke<string[]>("list_local_users"),
};
