use crate::models::ServiceInfo;

#[cfg(windows)]
pub fn list_services() -> Result<Vec<ServiceInfo>, String> {
    use windows::Win32::System::Services::{
        EnumServicesStatusExW, OpenSCManagerW, ENUM_SERVICE_STATUS_PROCESSW, SC_ENUM_PROCESS_INFO,
        SC_MANAGER_ENUMERATE_SERVICE, SERVICE_STATE_ALL, SERVICE_WIN32,
    };

    unsafe {
        let scm = OpenSCManagerW(None, None, SC_MANAGER_ENUMERATE_SERVICE)
            .map_err(|e| e.to_string())?;

        let mut bytes_needed = 0u32;
        let mut services_returned = 0u32;
        let mut resume = 0u32;
        let _ = EnumServicesStatusExW(
            scm,
            SC_ENUM_PROCESS_INFO,
            SERVICE_WIN32,
            SERVICE_STATE_ALL,
            None,
            &mut bytes_needed,
            &mut services_returned,
            Some(&mut resume),
            None,
        );

        if bytes_needed == 0 {
            return Ok(vec![]);
        }

        let mut buffer = vec![0u8; bytes_needed as usize];
        resume = 0;
        EnumServicesStatusExW(
            scm,
            SC_ENUM_PROCESS_INFO,
            SERVICE_WIN32,
            SERVICE_STATE_ALL,
            Some(&mut buffer),
            &mut bytes_needed,
            &mut services_returned,
            Some(&mut resume),
            None,
        )
        .map_err(|e| e.to_string())?;

        let mut out = Vec::with_capacity(services_returned as usize);
        let ptr = buffer.as_ptr() as *const ENUM_SERVICE_STATUS_PROCESSW;
        for i in 0..services_returned as isize {
            let item = &*ptr.offset(i);
            let name = pwstr_to_string(item.lpServiceName);
            let display = pwstr_to_string(item.lpDisplayName);
            let status = service_state(item.ServiceStatusProcess);
            out.push(ServiceInfo {
                name,
                display_name: display,
                status,
                start_type: "—".into(),
                description: None,
            });
        }
        out.sort_by(|a, b| {
            a.display_name
                .to_lowercase()
                .cmp(&b.display_name.to_lowercase())
        });
        Ok(out)
    }
}

#[cfg(windows)]
fn pwstr_to_string(p: windows::core::PWSTR) -> String {
    if p.is_null() {
        return String::new();
    }
    unsafe { p.to_string().unwrap_or_default() }
}

#[cfg(windows)]
fn service_state(status: windows::Win32::System::Services::SERVICE_STATUS_PROCESS) -> String {
    use windows::Win32::System::Services::{
        SERVICE_CONTINUE_PENDING, SERVICE_PAUSED, SERVICE_PAUSE_PENDING, SERVICE_RUNNING,
        SERVICE_START_PENDING, SERVICE_STOP_PENDING, SERVICE_STOPPED,
    };
    match status.dwCurrentState {
        SERVICE_STOPPED => "Stopped".into(),
        SERVICE_START_PENDING => "Start Pending".into(),
        SERVICE_STOP_PENDING => "Stop Pending".into(),
        SERVICE_RUNNING => "Running".into(),
        SERVICE_CONTINUE_PENDING => "Continue Pending".into(),
        SERVICE_PAUSE_PENDING => "Pause Pending".into(),
        SERVICE_PAUSED => "Paused".into(),
        _ => "Unknown".into(),
    }
}

#[cfg(not(windows))]
pub fn list_services() -> Result<Vec<ServiceInfo>, String> {
    Ok(vec![])
}

#[cfg(windows)]
pub fn control_service(name: &str, action: &str) -> Result<String, String> {
    use std::os::windows::ffi::OsStrExt;
    use windows::core::PCWSTR;
    use windows::Win32::System::Services::{
        ControlService, OpenSCManagerW, OpenServiceW, StartServiceW, SC_MANAGER_ALL_ACCESS,
        SERVICE_ALL_ACCESS, SERVICE_CONTROL_STOP,
    };

    let wide: Vec<u16> = std::ffi::OsStr::new(name)
        .encode_wide()
        .chain(Some(0))
        .collect();

    unsafe {
        let scm = OpenSCManagerW(None, None, SC_MANAGER_ALL_ACCESS).map_err(|e| e.to_string())?;
        let svc = OpenServiceW(scm, PCWSTR(wide.as_ptr()), SERVICE_ALL_ACCESS)
            .map_err(|e| e.to_string())?;
        match action {
            "start" => {
                StartServiceW(svc, None).map_err(|e| e.to_string())?;
                Ok(format!("Started {name}"))
            }
            "stop" => {
                let mut status = std::mem::zeroed();
                ControlService(svc, SERVICE_CONTROL_STOP, &mut status)
                    .map_err(|e| e.to_string())?;
                Ok(format!("Stopped {name}"))
            }
            _ => Err("Unknown action".into()),
        }
    }
}

#[cfg(not(windows))]
pub fn control_service(_name: &str, _action: &str) -> Result<String, String> {
    Err("Services are Windows-only".into())
}
