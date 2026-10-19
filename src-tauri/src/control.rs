use serde::Serialize;
use std::process::Command;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlAction {
    pub id: String,
    pub title: String,
    pub description: String,
    pub group: String,
}

fn a(id: &str, title: &str, description: &str, group: &str) -> ControlAction {
    ControlAction {
        id: id.into(),
        title: title.into(),
        description: description.into(),
        group: group.into(),
    }
}

pub fn catalog() -> Vec<ControlAction> {
    vec![
        // Settings
        a("settings-system", "System", "ms-settings:system", "Settings"),
        a("settings-display", "Display", "ms-settings:display", "Settings"),
        a("settings-sound", "Sound", "ms-settings:sound", "Settings"),
        a("settings-notifications", "Notifications", "ms-settings:notifications", "Settings"),
        a("settings-focus", "Focus assist", "ms-settings:quiethours", "Settings"),
        a("settings-power", "Power & battery", "ms-settings:powersleep", "Settings"),
        a("settings-storage", "Storage", "ms-settings:storagesense", "Settings"),
        a("settings-apps", "Installed apps", "ms-settings:appsfeatures", "Settings"),
        a("settings-default-apps", "Default apps", "ms-settings:defaultapps", "Settings"),
        a("settings-network", "Network & internet", "ms-settings:network", "Settings"),
        a("settings-wifi", "Wi-Fi", "ms-settings:network-wifi", "Settings"),
        a("settings-ethernet", "Ethernet", "ms-settings:network-ethernet", "Settings"),
        a("settings-vpn", "VPN", "ms-settings:network-vpn", "Settings"),
        a("settings-bluetooth", "Bluetooth", "ms-settings:bluetooth", "Settings"),
        a("settings-devices", "Bluetooth & devices", "ms-settings:devices", "Settings"),
        a("settings-printers", "Printers & scanners", "ms-settings:printers", "Settings"),
        a("settings-accounts", "Accounts", "ms-settings:yourinfo", "Settings"),
        a("settings-signin", "Sign-in options", "ms-settings:signinoptions", "Settings"),
        a("settings-windows-update", "Windows Update", "ms-settings:windowsupdate", "Settings"),
        a("settings-activation", "Activation", "ms-settings:activation", "Settings"),
        a("settings-privacy", "Privacy & security", "ms-settings:privacy", "Settings"),
        a("settings-security", "Windows Security", "windowsdefender:", "Settings"),
        a("settings-about", "About PC", "ms-settings:about", "Settings"),
        a("settings-datetime", "Date & time", "ms-settings:dateandtime", "Settings"),
        a("settings-region", "Language & region", "ms-settings:regionlanguage", "Settings"),
        a("settings-accessibility", "Accessibility", "ms-settings:easeofaccess", "Settings"),
        a("settings-gaming", "Gaming", "ms-settings:gaming-gamebar", "Settings"),
        a("settings-personalization", "Personalization", "ms-settings:personalization", "Settings"),
        a("settings-themes", "Themes", "ms-settings:themes", "Settings"),
        a("settings-colors", "Colors", "ms-settings:colors", "Settings"),
        a("settings-taskbar", "Taskbar", "ms-settings:taskbar", "Settings"),
        a("settings-startup", "Startup apps", "ms-settings:startupapps", "Settings"),
        a("settings-optional", "Optional features", "ms-settings:optionalfeatures", "Settings"),
        a("settings-recovery", "Recovery", "ms-settings:recovery", "Settings"),
        a("settings-troubleshoot", "Troubleshoot", "ms-settings:troubleshoot", "Settings"),
        // Win+X Power User menu (REA: Taskmgr + dmdskmgr + *.msc) — also in-app under Admin Console
        a("winx-power", "Power Options (Win+X)", "powercfg.cpl — plans, sleep, lid", "Win+X"),
        a("winx-events", "Event Viewer (Win+X)", "eventvwr.msc — System/App/Security", "Win+X"),
        a("winx-system", "System (Win+X)", "ms-settings:about — PC specs", "Win+X"),
        a("winx-devices", "Device Manager (Win+X)", "devmgmt.msc — drivers & PnP", "Win+X"),
        a("winx-ncpa", "Network Connections (Win+X)", "ncpa.cpl — adapters", "Win+X"),
        a("winx-disk", "Disk Management (Win+X)", "diskmgmt.msc — volumes & partitions", "Win+X"),
        a("winx-compmgmt", "Computer Management (Win+X)", "compmgmt.msc — admin console", "Win+X"),
        a("taskmgr", "Task Manager", "taskmgr.exe — processes & efficiency", "Win+X"),
        // Hardware / MMC (REA: mmc.exe hosts snap-ins)
        a("device-manager", "Device Manager", "devmgmt.msc", "Hardware"),
        a("disk-mgmt", "Disk Management", "diskmgmt.msc", "Hardware"),
        a("computer-mgmt", "Computer Management", "compmgmt.msc", "Hardware"),
        a("disk-defrag", "Optimize Drives", "dfrgui", "Hardware"),
        a("print-mgmt", "Print Management", "printmanagement.msc", "Hardware"),
        a("devmode", "Developer settings", "ms-settings:developers", "Hardware"),
        // Security / Network
        a("firewall", "Windows Defender Firewall", "firewall.cpl", "Security"),
        a("wf-advanced", "Advanced Firewall", "wf.msc", "Security"),
        a("secpol", "Local Security Policy", "secpol.msc", "Security"),
        a("gpedit", "Group Policy Editor", "gpedit.msc", "Security"),
        a("certmgr", "Certificates", "certmgr.msc", "Security"),
        a("credman", "Credential Manager", "control /name Microsoft.CredentialManager", "Security"),
        // Diagnostics (Task Manager adjacent — REA Taskmgr.exe)
        a("resource-monitor", "Resource Monitor", "resmon", "Diagnostics"),
        a("perfmon", "Performance Monitor", "perfmon", "Diagnostics"),
        a("event-viewer", "Event Viewer", "eventvwr.msc", "Diagnostics"),
        a("services-msc", "Services", "services.msc", "Diagnostics"),
        a("task-scheduler", "Task Scheduler", "taskschd.msc", "Diagnostics"),
        a("msconfig", "System Configuration", "msconfig", "Diagnostics"),
        a("msinfo", "System Information", "msinfo32", "Diagnostics"),
        a("dxdiag", "DirectX Diagnostic", "dxdiag", "Diagnostics"),
        a("reliability", "Reliability Monitor", "perfmon /rel", "Diagnostics"),
        a("system-properties", "System Properties", "sysdm.cpl", "Diagnostics"),
        a("winver", "Windows Version", "winver", "Diagnostics"),
        // Network tools
        a("ncpa", "Network Connections", "ncpa.cpl", "Network"),
        a("inetcpl", "Internet Options", "inetcpl.cpl", "Network"),
        a("flush-dns", "Flush DNS", "ipconfig /flushdns", "Network"),
        a("release-renew", "Release / Renew IP", "ipconfig release+renew", "Network"),
        a("netstat", "Open netstat view", "cmd /k netstat -ano", "Network"),
        // Storage
        a("cleanmgr", "Disk Cleanup", "cleanmgr", "Storage"),
        a("empty-recycle", "Empty Recycle Bin", "SHEmptyRecycleBin", "Storage"),
        a("storage-settings", "Storage settings", "ms-settings:storagesense", "Storage"),
        // Power
        a("powercfg", "Power Options", "powercfg.cpl", "Power"),
        a("power-sleep", "Sleep settings", "ms-settings:powersleep", "Power"),
        // Legacy Control Panel
        a("control-panel", "Control Panel", "control", "Legacy"),
        a("godmode", "God Mode", "ED7BA470…", "Legacy"),
        a("appwiz", "Programs and Features", "appwiz.cpl", "Legacy"),
        a("timedate", "Date and Time", "timedate.cpl", "Legacy"),
        a("mmsys", "Sound (classic)", "mmsys.cpl", "Legacy"),
        a("desk", "Display (classic)", "desk.cpl", "Legacy"),
        a("main", "Mouse", "main.cpl", "Legacy"),
        a("intl", "Region", "intl.cpl", "Legacy"),
        a("nusrmgr", "User Accounts", "nusrmgr.cpl", "Legacy"),
        a("hdwwiz", "Add Hardware", "hdwwiz.cpl", "Legacy"),
        a("sysdm", "System (classic)", "sysdm.cpl", "Legacy"),
        a("optionalfeatures", "Windows Features", "optionalfeatures", "Legacy"),
        // NVIDIA / GPU related launchers
        a("nvidia-control", "NVIDIA Control Panel", "nvcplui", "GPU"),
        a("nvidia-app", "NVIDIA App / GeForce", "NVIDIA App", "GPU"),
        a("dxdiag-gpu", "DXDiag Display", "dxdiag", "GPU"),
    ]
}

pub fn run_action(id: &str) -> Result<String, String> {
    match id {
        "settings-system" => open_uri("ms-settings:system"),
        "settings-display" => open_uri("ms-settings:display"),
        "settings-sound" => open_uri("ms-settings:sound"),
        "settings-notifications" => open_uri("ms-settings:notifications"),
        "settings-focus" => open_uri("ms-settings:quiethours"),
        "settings-power" | "power-sleep" => open_uri("ms-settings:powersleep"),
        "settings-storage" | "storage-settings" => open_uri("ms-settings:storagesense"),
        "settings-apps" => open_uri("ms-settings:appsfeatures"),
        "settings-default-apps" => open_uri("ms-settings:defaultapps"),
        "settings-network" => open_uri("ms-settings:network"),
        "settings-wifi" => open_uri("ms-settings:network-wifi"),
        "settings-ethernet" => open_uri("ms-settings:network-ethernet"),
        "settings-vpn" => open_uri("ms-settings:network-vpn"),
        "settings-bluetooth" => open_uri("ms-settings:bluetooth"),
        "settings-devices" => open_uri("ms-settings:devices"),
        "settings-printers" => open_uri("ms-settings:printers"),
        "settings-accounts" => open_uri("ms-settings:yourinfo"),
        "settings-signin" => open_uri("ms-settings:signinoptions"),
        "settings-windows-update" => open_uri("ms-settings:windowsupdate"),
        "settings-activation" => open_uri("ms-settings:activation"),
        "settings-privacy" => open_uri("ms-settings:privacy"),
        "settings-security" => open_uri("windowsdefender:"),
        "settings-about" => open_uri("ms-settings:about"),
        "settings-datetime" => open_uri("ms-settings:dateandtime"),
        "settings-region" => open_uri("ms-settings:regionlanguage"),
        "settings-accessibility" => open_uri("ms-settings:easeofaccess"),
        "settings-gaming" => open_uri("ms-settings:gaming-gamebar"),
        "settings-personalization" => open_uri("ms-settings:personalization"),
        "settings-themes" => open_uri("ms-settings:themes"),
        "settings-colors" => open_uri("ms-settings:colors"),
        "settings-taskbar" => open_uri("ms-settings:taskbar"),
        "settings-startup" => open_uri("ms-settings:startupapps"),
        "settings-optional" => open_uri("ms-settings:optionalfeatures"),
        "settings-recovery" => open_uri("ms-settings:recovery"),
        "settings-troubleshoot" => open_uri("ms-settings:troubleshoot"),
        "devmode" => open_uri("ms-settings:developers"),
        "control-panel" => spawn("control", &[]),
        "device-manager" | "winx-devices" => spawn("devmgmt.msc", &[]),
        "disk-mgmt" | "winx-disk" => spawn("diskmgmt.msc", &[]),
        "computer-mgmt" | "winx-compmgmt" => spawn("compmgmt.msc", &[]),
        "winx-power" => spawn("powercfg.cpl", &[]),
        "winx-events" | "event-viewer" => spawn("eventvwr.msc", &[]),
        "winx-system" => open_uri("ms-settings:about"),
        "winx-ncpa" => spawn("ncpa.cpl", &[]),
        "taskmgr" => spawn("taskmgr", &[]),
        "disk-defrag" => spawn("dfrgui", &[]),
        "print-mgmt" => spawn("printmanagement.msc", &[]),
        "firewall" => spawn("firewall.cpl", &[]),
        "wf-advanced" => spawn("wf.msc", &[]),
        "secpol" => spawn("secpol.msc", &[]),
        "gpedit" => spawn("gpedit.msc", &[]),
        "certmgr" => spawn("certmgr.msc", &[]),
        "credman" => spawn_cmd("control /name Microsoft.CredentialManager"),
        "resource-monitor" => spawn("resmon", &[]),
        "perfmon" => spawn("perfmon", &[]),
        "services-msc" => spawn("services.msc", &[]),
        "task-scheduler" => spawn("taskschd.msc", &[]),
        "msconfig" => spawn("msconfig", &[]),
        "msinfo" => spawn("msinfo32", &[]),
        "dxdiag" | "dxdiag-gpu" => spawn("dxdiag", &[]),
        "reliability" => spawn_cmd("perfmon /rel"),
        "system-properties" | "sysdm" => spawn("sysdm.cpl", &[]),
        "winver" => spawn("winver", &[]),
        "ncpa" => spawn("ncpa.cpl", &[]),
        "inetcpl" => spawn("inetcpl.cpl", &[]),
        "cleanmgr" => spawn("cleanmgr", &[]),
        "powercfg" => spawn("powercfg.cpl", &[]),
        "appwiz" => spawn("appwiz.cpl", &[]),
        "timedate" => spawn("timedate.cpl", &[]),
        "mmsys" => spawn("mmsys.cpl", &[]),
        "desk" => spawn("desk.cpl", &[]),
        "main" => spawn("main.cpl", &[]),
        "intl" => spawn("intl.cpl", &[]),
        "nusrmgr" => spawn("nusrmgr.cpl", &[]),
        "hdwwiz" => spawn("hdwwiz.cpl", &[]),
        "optionalfeatures" => spawn("optionalfeatures", &[]),
        "netstat" => spawn_cmd("cmd /k netstat -ano"),
        "nvidia-control" => try_spawn(&[
            r"C:\Program Files\NVIDIA Corporation\Control Panel Client\nvcplui.exe",
            "nvcplui",
        ]),
        "nvidia-app" => try_spawn(&[
            r"C:\Program Files\NVIDIA Corporation\NVIDIA App\CEF\NVIDIA App.exe",
            r"C:\Program Files\NVIDIA Corporation\NVIDIA GeForce Experience\NVIDIA GeForce Experience.exe",
        ]),
        "godmode" => {
            let path = std::env::temp_dir()
                .join("Kyrus GodMode.{ED7BA470-8E54-465E-825C-99712043E01C}");
            let _ = std::fs::create_dir_all(&path);
            open::that(&path).map_err(|e| e.to_string())?;
            Ok("Opened God Mode".into())
        }
        "flush-dns" => {
            let output = crate::shellutil::run_hidden("ipconfig", &["/flushdns"])?;
            if output.status.success() {
                Ok("DNS cache flushed".into())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        }
        "release-renew" => crate::network::release_renew(),
        "empty-recycle" => empty_recycle_bin(),
        _ => Err("Unknown control action".into()),
    }
}

fn open_uri(uri: &str) -> Result<String, String> {
    open::that(uri).map_err(|e| e.to_string())?;
    Ok(format!("Opened {uri}"))
}

fn spawn(program: &str, args: &[&str]) -> Result<String, String> {
    Command::new("cmd")
        .args(["/C", "start", "", program])
        .args(args)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(format!("Launched {program}"))
}

fn spawn_cmd(cmdline: &str) -> Result<String, String> {
    Command::new("cmd")
        .args(["/C", "start", "", "cmd", "/C", cmdline])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(format!("Ran {cmdline}"))
}

fn try_spawn(candidates: &[&str]) -> Result<String, String> {
    for c in candidates {
        if std::path::Path::new(c).exists() || !c.contains('\\') {
            if Command::new("cmd")
                .args(["/C", "start", "", c])
                .spawn()
                .is_ok()
            {
                return Ok(format!("Launched {c}"));
            }
        }
    }
    Err("NVIDIA control UI not found on this PC".into())
}

#[cfg(windows)]
fn empty_recycle_bin() -> Result<String, String> {
    use windows::Win32::UI::Shell::{SHEmptyRecycleBinW, SHERB_NOCONFIRMATION, SHERB_NOPROGRESSUI};
    unsafe {
        SHEmptyRecycleBinW(None, None, SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI)
            .map_err(|e| e.to_string())?;
    }
    Ok("Recycle Bin emptied".into())
}

#[cfg(not(windows))]
fn empty_recycle_bin() -> Result<String, String> {
    Err("Recycle Bin is Windows-only".into())
}
