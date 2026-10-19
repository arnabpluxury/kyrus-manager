export type DriveInfo = {
  name: string;
  mountPoint: string;
  fileSystem: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usedPercent: number;
  isRemovable: boolean;
  driveType: string;
};

export type StorageEntry = {
  path: string;
  name: string;
  sizeBytes: number;
  isDir: boolean;
  category: string;
  modified?: number | null;
  extension?: string | null;
};

export type StorageScanResult = {
  root: string;
  entries: StorageEntry[];
  totalScannedBytes: number;
  fileCount: number;
  dirCount: number;
  elapsedMs: number;
  truncated: boolean;
  inaccessibleCount?: number;
  driveUsedBytes?: number | null;
  driveTotalBytes?: number | null;
  driveFreeBytes?: number | null;
  unaccountedBytes?: number | null;
  deep?: boolean;
};

export type LargeFile = {
  path: string;
  name: string;
  sizeBytes: number;
  category: string;
  extension?: string | null;
};

export type EnvVar = { name: string; value: string; scope: string };
export type PowerPlan = { guid: string; name: string; active: boolean };
export type EventEntry = {
  time: string;
  level: string;
  source: string;
  eventId: string;
  message: string;
};

export type TempCandidate = {
  path: string;
  name: string;
  sizeBytes: number;
  category: string;
  ageDays: number;
  safeToDelete: boolean;
};

export type ProcessInfo = {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryBytes: number;
  virtualMemoryBytes: number;
  diskReadBytes: number;
  diskWriteBytes: number;
  status: string;
  user: string;
  path?: string | null;
  parentPid?: number | null;
  threadCount: number;
  startTime?: number | null;
  elevated: boolean;
};

export type PerformanceSnapshot = {
  cpuUsage: number;
  cpuCores: number;
  frequencyMhz?: number | null;
  memoryTotal: number;
  memoryUsed: number;
  memoryAvailable: number;
  swapTotal: number;
  swapUsed: number;
  diskReadBytesPerSec: number;
  diskWriteBytesPerSec: number;
  networkRxBytesPerSec: number;
  networkTxBytesPerSec: number;
  processCount: number;
  uptimeSeconds: number;
  hostname: string;
  osName: string;
  osVersion: string;
  cpuBrand: string;
};

export type InstalledApp = {
  id: string;
  name: string;
  publisher?: string | null;
  version?: string | null;
  installDate?: string | null;
  installLocation?: string | null;
  uninstallString?: string | null;
  quietUninstallString?: string | null;
  estimatedSizeBytes?: number | null;
  iconBase64?: string | null;
  source: string;
  architecture: string;
};

export type ServiceInfo = {
  name: string;
  displayName: string;
  status: string;
  startType: string;
  description?: string | null;
  binaryPath?: string | null;
  iconBase64?: string | null;
  pid?: number | null;
};

export type StartupItem = {
  name: string;
  command: string;
  location: string;
  enabled: boolean;
  publisher?: string | null;
};

export type SpacePrediction = {
  currentFreeBytes: number;
  reclaimableBytes: number;
  freeAfterBytes: number;
  usedAfterPercent: number;
  drive: string;
  items: { label: string; path?: string | null; bytes: number; kind: string }[];
};

export type AdminStatus = {
  elevated: boolean;
  username: string;
  computerName: string;
};

export type ControlAction = {
  id: string;
  title: string;
  description: string;
  group: string;
};

export type TreemapNode = {
  name: string;
  path: string;
  sizeBytes: number;
  isDir: boolean;
  children: TreemapNode[];
};

export type GpuInfo = {
  name: string;
  adapterRamBytes?: number | null;
  driverVersion?: string | null;
  driverDate?: string | null;
  videoProcessor?: string | null;
  status?: string | null;
  pnpDeviceId?: string | null;
  vendor: string;
};

export type NvidiaGpu = {
  index: string;
  name: string;
  utilizationGpu?: string | null;
  utilizationMem?: string | null;
  memoryTotal?: string | null;
  memoryUsed?: string | null;
  temperature?: string | null;
  powerDraw?: string | null;
  powerLimit?: string | null;
  fanSpeed?: string | null;
  clocksGraphics?: string | null;
};

export type FirewallProfile = {
  name: string;
  state: string;
  inbound: string;
  outbound: string;
};

export type FirewallRule = {
  name: string;
  enabled: string;
  direction: string;
  profiles: string;
  action: string;
};

export type ScheduledTask = {
  name: string;
  status: string;
  nextRun: string;
  lastRun: string;
  lastResult: string;
  author: string;
  taskToRun: string;
  scheduleType: string;
};

export type NetworkAdapter = {
  name: string;
  receivedBytes: number;
  transmittedBytes: number;
  packetsReceived: number;
  packetsTransmitted: number;
  errorsOnReceived: number;
  errorsOnTransmitted: number;
};

export type UserSession = {
  username: string;
  sessionName: string;
  id: string;
  state: string;
  idleTime: string;
  logonTime: string;
};

export type PhysicalDisk = {
  number: number;
  friendlyName: string;
  sizeBytes: number;
  partitionStyle: string;
  operationalStatus: string;
  healthStatus: string;
  busType: string;
  isSystem: boolean;
  isBoot: boolean;
};

export type DiskPartition = {
  diskNumber: number;
  partitionNumber: number;
  driveLetter: string;
  sizeBytes: number;
  partitionType: string;
  isSystem: boolean;
  isBoot: boolean;
  isActive: boolean;
  gptType: string;
};

export type VolumeInfo = {
  driveLetter: string;
  label: string;
  fileSystem: string;
  sizeBytes: number;
  freeBytes: number;
  healthStatus: string;
  driveType: string;
};

export type DiskInventory = {
  disks: PhysicalDisk[];
  partitions: DiskPartition[];
  volumes: VolumeInfo[];
};

export type DeviceEntry = {
  instanceId: string;
  name: string;
  class: string;
  status: string;
  present: boolean;
  problem: string;
  manufacturer: string;
};

export type SystemAbout = {
  computerName: string;
  userName: string;
  osName: string;
  osVersion: string;
  osBuild: string;
  manufacturer: string;
  model: string;
  processor: string;
  totalMemoryBytes: number;
  systemType: string;
  biosVersion: string;
  domain: string;
  installDate: string;
  lastBoot: string;
};

export type EventLogEntry = {
  time: string;
  level: string;
  logName: string;
  source: string;
  eventId: string;
  message: string;
};

export type BloatItem = {
  id: string;
  name: string;
  kind: string;
  publisher: string;
  version: string;
  sizeBytes: number;
  reason: string;
  severity: string;
  removable: boolean;
  provisioned: boolean;
  path: string;
  details: string;
};

export type BloatScanResult = {
  items: BloatItem[];
  scannedPackages: number;
  threatCount: number;
  bloatCount: number;
  reclaimableBytes: number;
  elevated: boolean;
  notes: string[];
};

export type ViewId =
  | "overview"
  | "storage"
  | "cleanup"
  | "treemap"
  | "diskAnalyzer"
  | "processes"
  | "performance"
  | "gpu"
  | "apps"
  | "services"
  | "startup"
  | "users"
  | "scheduler"
  | "firewall"
  | "network"
  | "systemTools"
  | "adminConsole"
  | "diskManager"
  | "devices"
  | "bloatware"
  | "control";
