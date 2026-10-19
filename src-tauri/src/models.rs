use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveInfo {
    pub name: String,
    pub mount_point: String,
    pub file_system: String,
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub free_bytes: u64,
    pub used_percent: f64,
    pub is_removable: bool,
    pub drive_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageEntry {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub is_dir: bool,
    pub category: String,
    pub modified: Option<i64>,
    pub extension: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageScanResult {
    pub root: String,
    pub entries: Vec<StorageEntry>,
    pub total_scanned_bytes: u64,
    pub file_count: u64,
    pub dir_count: u64,
    pub elapsed_ms: u64,
    pub truncated: bool,
    #[serde(default)]
    pub inaccessible_count: u64,
    pub drive_used_bytes: Option<u64>,
    pub drive_total_bytes: Option<u64>,
    pub drive_free_bytes: Option<u64>,
    pub unaccounted_bytes: Option<u64>,
    #[serde(default = "default_true")]
    pub deep: bool,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TempCandidate {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub category: String,
    pub age_days: u64,
    pub safe_to_delete: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_bytes: u64,
    pub virtual_memory_bytes: u64,
    pub disk_read_bytes: u64,
    pub disk_write_bytes: u64,
    pub status: String,
    pub user: String,
    pub path: Option<String>,
    pub parent_pid: Option<u32>,
    pub thread_count: usize,
    pub start_time: Option<u64>,
    pub elevated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PerformanceSnapshot {
    pub cpu_usage: f32,
    pub cpu_cores: usize,
    pub frequency_mhz: Option<u64>,
    pub memory_total: u64,
    pub memory_used: u64,
    pub memory_available: u64,
    pub swap_total: u64,
    pub swap_used: u64,
    pub disk_read_bytes_per_sec: u64,
    pub disk_write_bytes_per_sec: u64,
    pub network_rx_bytes_per_sec: u64,
    pub network_tx_bytes_per_sec: u64,
    pub process_count: usize,
    pub uptime_seconds: u64,
    pub hostname: String,
    pub os_name: String,
    pub os_version: String,
    pub cpu_brand: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledApp {
    pub id: String,
    pub name: String,
    pub publisher: Option<String>,
    pub version: Option<String>,
    pub install_date: Option<String>,
    pub install_location: Option<String>,
    pub uninstall_string: Option<String>,
    pub quiet_uninstall_string: Option<String>,
    pub estimated_size_bytes: Option<u64>,
    pub icon_base64: Option<String>,
    pub source: String,
    pub architecture: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceInfo {
    pub name: String,
    pub display_name: String,
    pub status: String,
    pub start_type: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartupItem {
    pub name: String,
    pub command: String,
    pub location: String,
    pub enabled: bool,
    pub publisher: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpacePrediction {
    pub current_free_bytes: u64,
    pub reclaimable_bytes: u64,
    pub free_after_bytes: u64,
    pub used_after_percent: f64,
    pub drive: String,
    pub items: Vec<PredictionItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PredictionItem {
    pub label: String,
    pub path: Option<String>,
    pub bytes: u64,
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminStatus {
    pub elevated: bool,
    pub username: String,
    pub computer_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteResult {
    pub deleted: Vec<String>,
    pub failed: Vec<DeleteFailure>,
    pub freed_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFailure {
    pub path: String,
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UninstallResult {
    pub id: String,
    pub started: bool,
    pub mode: String,
    pub message: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanOptions {
    pub root: String,
    pub max_depth: Option<usize>,
    pub max_entries: Option<usize>,
    pub min_size_bytes: Option<u64>,
    pub extensions: Option<Vec<String>>,
    pub sort_by: Option<String>,
    pub sort_desc: Option<bool>,
    pub category: Option<String>,
    /// When true (default), folder sizes are fully recursive — required to see Steam, Users, etc.
    pub deep: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PredictRequest {
    pub paths: Option<Vec<String>>,
    pub app_ids: Option<Vec<String>>,
    pub temp_paths: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TreemapNode {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub is_dir: bool,
    pub children: Vec<TreemapNode>,
}
