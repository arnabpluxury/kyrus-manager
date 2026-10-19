mod admin;
mod apps;
mod cleanup;
mod control;
mod firewall;
mod gpu;
mod models;
mod network;
mod performance;
mod predict;
mod process;
mod scheduler;
mod services;
mod startup;
mod progress;
mod storage;
mod system_extra;
mod treemap;
mod users;
mod winmgmt;
mod bloatware;
mod shellutil;

use models::*;
use progress::ProgressEmitter;
use tauri::AppHandle;

#[tauri::command]
fn get_admin_status() -> AdminStatus {
    admin::status()
}

#[tauri::command]
fn relaunch_admin() -> Result<(), String> {
    admin::relaunch_as_admin()
}

#[tauri::command]
fn list_drives() -> Vec<DriveInfo> {
    storage::list_drives()
}

#[tauri::command]
async fn scan_storage(app: AppHandle, options: ScanOptions) -> Result<StorageScanResult, String> {
    let emitter = ProgressEmitter::new(app, "storage");
    tauri::async_runtime::spawn_blocking(move || {
        storage::scan_storage_with_progress(options, Some(&emitter))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn find_largest_files(
    app: AppHandle,
    root: String,
    limit: Option<usize>,
    min_size_bytes: Option<u64>,
) -> Result<Vec<storage::LargeFile>, String> {
    let emitter = ProgressEmitter::new(app, "largest");
    let lim = limit.unwrap_or(200);
    let min = min_size_bytes.unwrap_or(50 * 1024 * 1024);
    tauri::async_runtime::spawn_blocking(move || {
        storage::find_largest_files_with_progress(&root, lim, min, Some(&emitter))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn build_treemap(
    app: AppHandle,
    root: String,
    max_children: Option<usize>,
    max_depth: Option<usize>,
) -> Result<TreemapNode, String> {
    let emitter = ProgressEmitter::new(app, "treemap");
    let mc = max_children.unwrap_or(24);
    let md = max_depth.unwrap_or(2);
    tauri::async_runtime::spawn_blocking(move || {
        emitter.emit("mapping", &root, 0, 0, 0, true);
        let result = treemap::build_treemap(&root, mc, md);
        if result.is_ok() {
            emitter.finish("Treemap ready");
        }
        result
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn delete_paths(app: AppHandle, paths: Vec<String>) -> DeleteResult {
    let emitter = ProgressEmitter::new(app, "delete");
    tauri::async_runtime::spawn_blocking(move || {
        storage::delete_paths_with_progress(paths, Some(&emitter))
    })
    .await
    .unwrap_or(DeleteResult {
        deleted: vec![],
        failed: vec![],
        freed_bytes: 0,
    })
}

#[tauri::command]
async fn discover_temp(app: AppHandle) -> Vec<TempCandidate> {
    let emitter = ProgressEmitter::new(app, "cleanup");
    tauri::async_runtime::spawn_blocking(move || {
        emitter.emit("scanning", "Temp & junk locations", 0, 0, 0, true);
        let rows = cleanup::discover_temp();
        emitter.finish(&format!("{} candidates", rows.len()));
        rows
    })
    .await
    .unwrap_or_default()
}

#[tauri::command]
fn list_processes() -> Vec<ProcessInfo> {
    process::refresh_and_list()
}

#[tauri::command]
fn kill_process(pid: u32) -> Result<(), String> {
    process::kill_process(pid)
}

#[tauri::command]
fn kill_processes(pids: Vec<u32>) -> Vec<(u32, Result<(), String>)> {
    process::kill_processes(pids)
}

#[tauri::command]
fn set_process_priority(pid: u32, class: String) -> Result<(), String> {
    process::set_priority(pid, &class)
}

#[tauri::command]
fn get_performance() -> PerformanceSnapshot {
    performance::snapshot()
}

#[tauri::command]
fn list_apps() -> Vec<InstalledApp> {
    apps::list_installed_apps()
}

#[tauri::command]
fn uninstall_app(id: String, prefer_quiet: bool, auto_advance: bool) -> UninstallResult {
    apps::uninstall_app(&id, prefer_quiet, auto_advance)
}

#[tauri::command]
fn uninstall_apps(ids: Vec<String>, prefer_quiet: bool, auto_advance: bool) -> Vec<UninstallResult> {
    apps::uninstall_many(ids, prefer_quiet, auto_advance)
}

#[tauri::command]
fn list_services() -> Result<Vec<ServiceInfo>, String> {
    services::list_services()
}

#[tauri::command]
fn control_service(name: String, action: String) -> Result<String, String> {
    services::control_service(&name, &action)
}

#[tauri::command]
fn list_startup() -> Vec<StartupItem> {
    startup::list_startup()
}

#[tauri::command]
fn disable_startup(name: String, location: String) -> Result<(), String> {
    startup::disable_startup(&name, &location)
}

#[tauri::command]
fn predict_space(request: PredictRequest) -> SpacePrediction {
    predict::predict(request)
}

#[tauri::command]
fn control_catalog() -> Vec<control::ControlAction> {
    control::catalog()
}

#[tauri::command]
fn run_control_action(id: String) -> Result<String, String> {
    control::run_action(&id)
}

#[tauri::command]
fn list_gpus() -> Vec<gpu::GpuInfo> {
    gpu::list_gpus()
}

#[tauri::command]
fn nvidia_snapshot() -> gpu::NvidiaSnapshot {
    gpu::nvidia_snapshot()
}

#[tauri::command]
fn firewall_profiles() -> Result<Vec<firewall::FirewallProfile>, String> {
    firewall::list_profiles()
}

#[tauri::command]
fn firewall_rules(limit: Option<usize>) -> Result<Vec<firewall::FirewallRule>, String> {
    firewall::list_rules(limit.unwrap_or(200))
}

#[tauri::command]
fn firewall_set_state(profile: String, enable: bool) -> Result<String, String> {
    firewall::set_profile_state(&profile, enable)
}

#[tauri::command]
fn list_scheduled_tasks(limit: Option<usize>) -> Result<Vec<scheduler::ScheduledTask>, String> {
    scheduler::list_tasks(limit.unwrap_or(400))
}

#[tauri::command]
fn run_scheduled_task(name: String) -> Result<String, String> {
    scheduler::run_task(&name)
}

#[tauri::command]
fn end_scheduled_task(name: String) -> Result<String, String> {
    scheduler::end_task(&name)
}

#[tauri::command]
fn set_scheduled_task(name: String, enable: bool) -> Result<String, String> {
    scheduler::change_task(&name, enable)
}

#[tauri::command]
fn list_network_adapters() -> Vec<network::NetworkAdapter> {
    network::list_adapters()
}

#[tauri::command]
fn ipconfig_all() -> Result<Vec<network::IpConfigEntry>, String> {
    network::ipconfig_all()
}

#[tauri::command]
fn list_user_sessions() -> Result<Vec<users::UserSession>, String> {
    users::list_sessions()
}

#[tauri::command]
fn list_local_users() -> Result<Vec<String>, String> {
    users::list_local_users()
}

#[tauri::command]
fn list_env_vars() -> Vec<system_extra::EnvVar> {
    system_extra::list_env_vars()
}

#[tauri::command]
fn list_power_plans() -> Result<Vec<system_extra::PowerPlan>, String> {
    system_extra::list_power_plans()
}

#[tauri::command]
fn set_power_plan(guid: String) -> Result<String, String> {
    system_extra::set_power_plan(&guid)
}

#[tauri::command]
fn recent_system_errors(limit: Option<usize>) -> Result<Vec<system_extra::EventEntry>, String> {
    system_extra::recent_errors(limit.unwrap_or(80))
}

#[tauri::command]
fn reveal_in_explorer(path: String) -> Result<String, String> {
    system_extra::reveal_in_explorer(&path)
}

#[tauri::command]
fn kill_process_tree(pid: u32) -> Result<(), String> {
    process::kill_process_tree(pid)
}

#[tauri::command]
fn suspend_process(pid: u32) -> Result<(), String> {
    process::suspend_process(pid)
}

#[tauri::command]
fn resume_process(pid: u32) -> Result<(), String> {
    process::resume_process(pid)
}

#[tauri::command]
fn disk_inventory() -> Result<winmgmt::DiskInventory, String> {
    winmgmt::disk_inventory()
}

#[tauri::command]
fn set_disk_online(number: i32, online: bool) -> Result<String, String> {
    winmgmt::set_disk_online(number, online)
}

#[tauri::command]
fn set_disk_readonly(number: i32, read_only: bool) -> Result<String, String> {
    winmgmt::set_disk_readonly(number, read_only)
}

#[tauri::command]
fn list_devices(class: Option<String>) -> Result<Vec<winmgmt::DeviceEntry>, String> {
    winmgmt::list_devices(class)
}

#[tauri::command]
fn set_device_enabled(instance_id: String, enable: bool) -> Result<String, String> {
    winmgmt::set_device_enabled(&instance_id, enable)
}

#[tauri::command]
fn system_about() -> Result<winmgmt::SystemAbout, String> {
    winmgmt::system_about()
}

#[tauri::command]
fn list_event_log(
    log: Option<String>,
    limit: Option<usize>,
    level: Option<String>,
) -> Result<Vec<winmgmt::EventLogEntry>, String> {
    winmgmt::list_events(
        log.as_deref().unwrap_or("System"),
        limit.unwrap_or(120),
        level,
    )
}

#[tauri::command]
fn set_adapter_enabled(name: String, enable: bool) -> Result<String, String> {
    winmgmt::set_adapter_enabled(&name, enable)
}

#[tauri::command]
fn rescan_disks() -> Result<String, String> {
    winmgmt::rescan_disks()
}

#[tauri::command]
fn assign_drive_letter(
    disk_number: i32,
    partition_number: i32,
    letter: String,
) -> Result<String, String> {
    winmgmt::assign_drive_letter(disk_number, partition_number, &letter)
}

#[tauri::command]
fn remove_drive_letter(disk_number: i32, partition_number: i32) -> Result<String, String> {
    winmgmt::remove_drive_letter(disk_number, partition_number)
}

#[tauri::command]
fn initialize_disk(number: i32, style: Option<String>) -> Result<String, String> {
    winmgmt::initialize_disk(number, style.as_deref().unwrap_or("GPT"))
}

#[tauri::command]
fn open_volume(letter: String) -> Result<String, String> {
    winmgmt::open_volume(&letter)
}

#[tauri::command]
async fn scan_bloatware(app: AppHandle) -> Result<bloatware::BloatScanResult, String> {
    let emitter = ProgressEmitter::new(app, "bloatware");
    tauri::async_runtime::spawn_blocking(move || bloatware::scan_bloatware(Some(&emitter)))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn remove_bloat_items(ids: Vec<String>) -> Vec<bloatware::BloatRemoveResult> {
    tauri::async_runtime::spawn_blocking(move || bloatware::remove_bloat_items(ids))
        .await
        .unwrap_or_default()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Release builds always elevate (UAC). Debug/`tauri dev` stays asInvoker so
    // cargo can spawn the process and Vite on localhost:1420 keeps working.
    #[cfg(all(windows, not(debug_assertions)))]
    {
        if !admin::is_elevated() {
            match admin::relaunch_as_admin() {
                Ok(()) => return,
                Err(e) => eprintln!("Failed to elevate: {e}"),
            }
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(target_os = "windows")]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    // Prefer Mica; Acrylic is a fallback on unsupported builds.
                    if window_vibrancy::apply_mica(&window, Some(true)).is_err() {
                        let _ = window_vibrancy::apply_acrylic(&window, Some((18, 22, 28, 180)));
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_admin_status,
            relaunch_admin,
            list_drives,
            scan_storage,
            find_largest_files,
            delete_paths,
            discover_temp,
            list_processes,
            kill_process,
            kill_processes,
            set_process_priority,
            get_performance,
            list_apps,
            uninstall_app,
            uninstall_apps,
            list_services,
            control_service,
            list_startup,
            disable_startup,
            predict_space,
            control_catalog,
            run_control_action,
            build_treemap,
            list_gpus,
            nvidia_snapshot,
            firewall_profiles,
            firewall_rules,
            firewall_set_state,
            list_scheduled_tasks,
            run_scheduled_task,
            end_scheduled_task,
            set_scheduled_task,
            list_network_adapters,
            ipconfig_all,
            list_user_sessions,
            list_local_users,
            list_env_vars,
            list_power_plans,
            set_power_plan,
            recent_system_errors,
            reveal_in_explorer,
            kill_process_tree,
            suspend_process,
            resume_process,
            disk_inventory,
            set_disk_online,
            set_disk_readonly,
            list_devices,
            set_device_enabled,
            system_about,
            list_event_log,
            set_adapter_enabled,
            rescan_disks,
            assign_drive_letter,
            remove_drive_letter,
            initialize_disk,
            open_volume,
            scan_bloatware,
            remove_bloat_items,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kyrus Manager");
}
