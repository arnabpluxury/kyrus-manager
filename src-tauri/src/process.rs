use crate::models::ProcessInfo;
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use sysinfo::{ProcessesToUpdate, System};

pub(crate) static SYSTEM: Lazy<Mutex<System>> = Lazy::new(|| Mutex::new(System::new_all()));

pub fn refresh_and_list() -> Vec<ProcessInfo> {
    let mut sys = SYSTEM.lock();
    sys.refresh_cpu_all();
    sys.refresh_memory();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    let mut list: Vec<ProcessInfo> = sys
        .processes()
        .iter()
        .map(|(pid, proc)| {
            let disk = proc.disk_usage();
            ProcessInfo {
                pid: pid.as_u32(),
                name: proc.name().to_string_lossy().to_string(),
                cpu_usage: proc.cpu_usage(),
                memory_bytes: proc.memory(),
                virtual_memory_bytes: proc.virtual_memory(),
                disk_read_bytes: disk.total_read_bytes,
                disk_write_bytes: disk.total_written_bytes,
                status: format!("{:?}", proc.status()),
                user: proc
                    .user_id()
                    .map(|u| u.to_string())
                    .unwrap_or_else(|| "—".into()),
                path: proc.exe().map(|p| p.to_string_lossy().to_string()),
                parent_pid: proc.parent().map(|p| p.as_u32()),
                thread_count: 0,
                start_time: Some(proc.start_time()),
                elevated: false,
            }
        })
        .collect();

    list.sort_by(|a, b| {
        b.cpu_usage
            .partial_cmp(&a.cpu_usage)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| b.memory_bytes.cmp(&a.memory_bytes))
    });
    list
}

pub fn kill_process(pid: u32) -> Result<(), String> {
    let mut sys = SYSTEM.lock();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    let pid = sysinfo::Pid::from_u32(pid);
    match sys.process(pid) {
        Some(proc) => {
            if proc.kill() {
                Ok(())
            } else {
                Err("Failed to terminate process (access denied or protected)".into())
            }
        }
        None => Err("Process not found".into()),
    }
}

pub fn kill_processes(pids: Vec<u32>) -> Vec<(u32, Result<(), String>)> {
    pids.into_iter()
        .map(|pid| (pid, kill_process(pid)))
        .collect()
}

/// End process and children (Task Manager "End process tree").
pub fn kill_process_tree(pid: u32) -> Result<(), String> {
    let status = crate::shellutil::status_hidden(
        "taskkill",
        &["/PID", &pid.to_string(), "/T", "/F"],
    )?;
    if status.success() {
        Ok(())
    } else {
        Err("taskkill /T failed (access denied or process protected)".into())
    }
}

pub fn suspend_process(pid: u32) -> Result<(), String> {
    crate::shellutil::powershell_json(&format!(
        "Suspend-Process -Id {pid} -ErrorAction Stop; 'ok'"
    ))
    .map(|_| ())
}

pub fn resume_process(pid: u32) -> Result<(), String> {
    crate::shellutil::powershell_json(&format!(
        "Resume-Process -Id {pid} -ErrorAction Stop; 'ok'"
    ))
    .map(|_| ())
}

#[cfg(windows)]
pub fn set_priority(pid: u32, class: &str) -> Result<(), String> {
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::Threading::{
        OpenProcess, SetPriorityClass, ABOVE_NORMAL_PRIORITY_CLASS, BELOW_NORMAL_PRIORITY_CLASS,
        HIGH_PRIORITY_CLASS, IDLE_PRIORITY_CLASS, NORMAL_PRIORITY_CLASS, PROCESS_SET_INFORMATION,
        REALTIME_PRIORITY_CLASS,
    };

    let priority = match class.to_lowercase().as_str() {
        "idle" | "low" => IDLE_PRIORITY_CLASS,
        "below" | "below_normal" => BELOW_NORMAL_PRIORITY_CLASS,
        "normal" => NORMAL_PRIORITY_CLASS,
        "above" | "above_normal" => ABOVE_NORMAL_PRIORITY_CLASS,
        "high" => HIGH_PRIORITY_CLASS,
        "realtime" => REALTIME_PRIORITY_CLASS,
        _ => return Err("Unknown priority class".into()),
    };

    unsafe {
        let handle = OpenProcess(PROCESS_SET_INFORMATION, false, pid)
            .map_err(|e| e.to_string())?;
        let result = SetPriorityClass(handle, priority);
        let _ = CloseHandle(handle);
        result.map_err(|e| e.to_string())
    }
}

#[cfg(not(windows))]
pub fn set_priority(_pid: u32, _class: &str) -> Result<(), String> {
    Err("Priority control is Windows-only".into())
}
