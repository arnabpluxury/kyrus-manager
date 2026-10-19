use crate::models::ServiceInfo;
use crate::shellutil;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct PsService {
    name: Option<String>,
    display_name: Option<String>,
    state: Option<String>,
    start_mode: Option<String>,
    path_name: Option<String>,
    description: Option<String>,
    process_id: Option<u32>,
}

fn parse_array<T: for<'de> Deserialize<'de>>(text: &str) -> Vec<T> {
    if text.is_empty() || text == "null" {
        return vec![];
    }
    if text.starts_with('{') {
        return serde_json::from_str(text).into_iter().collect();
    }
    serde_json::from_str(text).unwrap_or_default()
}

fn clean_service_exe(path_name: &str) -> Option<String> {
    let trimmed = path_name.trim().trim_matches('"');
    if trimmed.is_empty() {
        return None;
    }
    // PathName often: "C:\...\svc.exe" -args  OR  C:\...\svc.exe -args
    let exe = if trimmed.starts_with('"') {
        trimmed
            .trim_start_matches('"')
            .split('"')
            .next()
            .unwrap_or(trimmed)
    } else {
        trimmed.split_whitespace().next().unwrap_or(trimmed)
    };
    let exe = exe.trim().trim_matches('"');
    if exe.to_lowercase().ends_with(".exe") && std::path::Path::new(exe).exists() {
        Some(exe.to_string())
    } else if std::path::Path::new(exe).exists() {
        Some(exe.to_string())
    } else {
        None
    }
}

pub fn list_services() -> Result<Vec<ServiceInfo>, String> {
    let script = r#"
$ErrorActionPreference='SilentlyContinue'
@(Get-CimInstance Win32_Service | ForEach-Object {
  [PSCustomObject]@{
    Name=$_.Name; DisplayName=$_.DisplayName; State=$_.State; StartMode=$_.StartMode;
    PathName=("$($_.PathName)"); Description=("$($_.Description)"); ProcessId=[uint32]$_.ProcessId
  }
}) | ConvertTo-Json -Compress
"#;
    let text = shellutil::powershell_json(script)?;
    let rows: Vec<PsService> = parse_array(&text);
    let mut out: Vec<ServiceInfo> = rows
        .into_iter()
        .map(|s| {
            let binary = s.path_name.as_deref().and_then(clean_service_exe);
            let icon = binary.as_deref().and_then(|path| {
                let lower = path.to_lowercase();
                // Skip shared hosts — icons would all look identical / wasteful
                if lower.ends_with("\\svchost.exe")
                    || lower.ends_with("\\dllhost.exe")
                    || lower.contains("\\windows\\system32\\")
                        && (lower.ends_with("\\services.exe") || lower.ends_with("\\lsass.exe"))
                {
                    return None;
                }
                crate::apps::extract_icon_base64_pub(path)
            });
            ServiceInfo {
                name: s.name.unwrap_or_default(),
                display_name: s.display_name.unwrap_or_default(),
                status: s.state.unwrap_or_else(|| "Unknown".into()),
                start_type: s.start_mode.unwrap_or_else(|| "—".into()),
                description: s.description.filter(|d| !d.is_empty()),
                binary_path: binary,
                icon_base64: icon,
                pid: s.process_id.filter(|&p| p > 0),
            }
        })
        .collect();
    out.sort_by(|a, b| {
        a.display_name
            .to_lowercase()
            .cmp(&b.display_name.to_lowercase())
    });
    Ok(out)
}

pub fn control_service(name: &str, action: &str) -> Result<String, String> {
    let n = name.replace('\'', "''");
    let script = match action {
        "start" => format!("Start-Service -Name '{n}' -ErrorAction Stop; 'Started'"),
        "stop" => format!("Stop-Service -Name '{n}' -Force -ErrorAction Stop; 'Stopped'"),
        "restart" => format!(
            "Restart-Service -Name '{n}' -Force -ErrorAction Stop; 'Restarted'"
        ),
        "pause" => format!("Suspend-Service -Name '{n}' -ErrorAction Stop; 'Paused'"),
        "continue" => format!("Resume-Service -Name '{n}' -ErrorAction Stop; 'Continued'"),
        "auto" => format!(
            "Set-Service -Name '{n}' -StartupType Automatic; 'Startup=Automatic'"
        ),
        "manual" => format!("Set-Service -Name '{n}' -StartupType Manual; 'Startup=Manual'"),
        "disabled" => format!(
            "Set-Service -Name '{n}' -StartupType Disabled; 'Startup=Disabled'"
        ),
        _ => return Err("Unknown action (start|stop|restart|pause|continue|auto|manual|disabled)".into()),
    };
    let out = shellutil::powershell_json(&script)?;
    Ok(format!("{out} · {name}"))
}
