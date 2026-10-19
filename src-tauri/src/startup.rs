use crate::models::StartupItem;
use winreg::enums::*;
use winreg::RegKey;

fn read_run_key(root: &RegKey, path: &str, location: &str, out: &mut Vec<StartupItem>) {
    let Ok(key) = root.open_subkey(path) else {
        return;
    };
    for name in key.enum_values().filter_map(|v| v.ok()).map(|(n, _)| n) {
        let command: String = match key.get_value(&name) {
            Ok(v) => v,
            Err(_) => continue,
        };
        if command.is_empty() {
            continue;
        }
        out.push(StartupItem {
            name,
            command,
            location: location.into(),
            enabled: true,
            publisher: None,
        });
    }
}

pub fn list_startup() -> Vec<StartupItem> {
    let mut out = Vec::new();
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    read_run_key(
        &hklm,
        "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
        "HKLM Run",
        &mut out,
    );
    read_run_key(
        &hkcu,
        "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
        "HKCU Run",
        &mut out,
    );
    read_run_key(
        &hklm,
        "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run",
        "HKLM Run (x86)",
        &mut out,
    );
    read_run_key(
        &hkcu,
        "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
        "HKCU RunOnce",
        &mut out,
    );

    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    out
}

pub fn disable_startup(name: &str, location: &str) -> Result<(), String> {
    let (hive, path) = match location {
        "HKLM Run" => (
            HKEY_LOCAL_MACHINE,
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
        ),
        "HKCU Run" => (
            HKEY_CURRENT_USER,
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
        ),
        "HKLM Run (x86)" => (
            HKEY_LOCAL_MACHINE,
            "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run",
        ),
        "HKCU RunOnce" => (
            HKEY_CURRENT_USER,
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
        ),
        _ => return Err("Unsupported startup location".into()),
    };
    let key = RegKey::predef(hive)
        .open_subkey_with_flags(path, KEY_ALL_ACCESS)
        .map_err(|e| e.to_string())?;
    key.delete_value(name).map_err(|e| e.to_string())
}
