use crate::models::{InstalledApp, UninstallResult};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use std::collections::HashSet;
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;
use winreg::enums::*;
use winreg::RegKey;

fn read_string(key: &RegKey, name: &str) -> Option<String> {
    key.get_value::<String, _>(name)
        .ok()
        .filter(|s| !s.is_empty())
}

fn read_dword(key: &RegKey, name: &str) -> Option<u32> {
    key.get_value::<u32, _>(name).ok()
}

#[cfg(windows)]
use std::os::windows::ffi::OsStrExt;

#[cfg(windows)]
fn extract_icon_base64(path: &str) -> Option<String> {
    use windows::Win32::Graphics::Gdi::{
        CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits,
        SelectObject, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS,
    };
    use windows::Win32::UI::Shell::ExtractIconExW;
    use windows::Win32::UI::WindowsAndMessaging::{DestroyIcon, DrawIconEx, DI_NORMAL};

    let wide: Vec<u16> = Path::new(path)
        .as_os_str()
        .encode_wide()
        .chain(Some(0))
        .collect();

    unsafe {
        let mut large = [windows::Win32::UI::WindowsAndMessaging::HICON::default(); 1];
        let count = ExtractIconExW(
            windows::core::PCWSTR(wide.as_ptr()),
            0,
            Some(large.as_mut_ptr()),
            None,
            1,
        );
        if count == 0 || large[0].is_invalid() {
            return None;
        }
        let icon = large[0];
        let size = 32i32;
        let hdc = CreateCompatibleDC(None);
        if hdc.is_invalid() {
            let _ = DestroyIcon(icon);
            return None;
        }
        let bmp = CreateCompatibleBitmap(hdc, size, size);
        let old = SelectObject(hdc, bmp.into());
        let _ = DrawIconEx(hdc, 0, 0, icon, size, size, 0, None, DI_NORMAL);

        let header = BITMAPINFOHEADER {
            biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: size,
            biHeight: -size,
            biPlanes: 1,
            biBitCount: 32,
            biCompression: BI_RGB.0 as u32,
            ..Default::default()
        };
        let mut info = BITMAPINFO {
            bmiHeader: header,
            bmiColors: [Default::default()],
        };
        let mut pixels = vec![0u8; (size * size * 4) as usize];
        let ok = GetDIBits(
            hdc,
            bmp,
            0,
            size as u32,
            Some(pixels.as_mut_ptr() as *mut _),
            &mut info,
            DIB_RGB_COLORS,
        );
        SelectObject(hdc, old);
        let _ = DeleteObject(bmp.into());
        let _ = DeleteDC(hdc);
        let _ = DestroyIcon(icon);
        if ok == 0 {
            return None;
        }

        let mut bmp_file = Vec::with_capacity(54 + pixels.len());
        let file_size = (54 + pixels.len()) as u32;
        bmp_file.extend_from_slice(b"BM");
        bmp_file.extend_from_slice(&file_size.to_le_bytes());
        bmp_file.extend_from_slice(&[0u8; 4]);
        bmp_file.extend_from_slice(&54u32.to_le_bytes());
        bmp_file.extend_from_slice(&header.biSize.to_le_bytes());
        bmp_file.extend_from_slice(&size.to_le_bytes());
        bmp_file.extend_from_slice(&size.to_le_bytes());
        bmp_file.extend_from_slice(&1u16.to_le_bytes());
        bmp_file.extend_from_slice(&32u16.to_le_bytes());
        bmp_file.extend_from_slice(&0u32.to_le_bytes());
        bmp_file.extend_from_slice(&(pixels.len() as u32).to_le_bytes());
        bmp_file.extend_from_slice(&[0u8; 16]);
        for row in (0..size as usize).rev() {
            let start = row * size as usize * 4;
            bmp_file.extend_from_slice(&pixels[start..start + size as usize * 4]);
        }
        Some(format!(
            "data:image/bmp;base64,{}",
            STANDARD.encode(bmp_file)
        ))
    }
}

#[cfg(not(windows))]
fn extract_icon_base64(_path: &str) -> Option<String> {
    None
}

fn icon_from_display_or_uninstall(
    display_icon: Option<&str>,
    uninstall: Option<&str>,
) -> Option<String> {
    for raw in [display_icon, uninstall].into_iter().flatten() {
        let cleaned = raw
            .trim_matches('"')
            .split(',')
            .next()
            .unwrap_or(raw)
            .trim()
            .trim_matches('"');
        let lower = cleaned.to_lowercase();
        if !(lower.ends_with(".exe") || lower.ends_with(".ico") || lower.ends_with(".dll")) {
            continue;
        }
        if Path::new(cleaned).exists() {
            if let Some(icon) = extract_icon_base64(cleaned) {
                return Some(icon);
            }
        }
    }
    None
}

fn push_app(
    id: String,
    key: &RegKey,
    arch: &str,
    out: &mut Vec<InstalledApp>,
    seen: &mut HashSet<String>,
) {
    let display_name = match read_string(key, "DisplayName") {
        Some(n) => n,
        None => return,
    };
    if read_dword(key, "SystemComponent").unwrap_or(0) == 1 {
        return;
    }
    if !seen.insert(id.clone()) {
        return;
    }
    let uninstall_string = read_string(key, "UninstallString");
    let quiet = read_string(key, "QuietUninstallString");
    let display_icon = read_string(key, "DisplayIcon");
    let icon_base64 =
        icon_from_display_or_uninstall(display_icon.as_deref(), uninstall_string.as_deref());
    out.push(InstalledApp {
        id,
        name: display_name,
        publisher: read_string(key, "Publisher"),
        version: read_string(key, "DisplayVersion"),
        install_date: read_string(key, "InstallDate"),
        install_location: read_string(key, "InstallLocation"),
        uninstall_string,
        quiet_uninstall_string: quiet,
        estimated_size_bytes: read_dword(key, "EstimatedSize").map(|kb| kb as u64 * 1024),
        icon_base64,
        source: "Registry".into(),
        architecture: arch.into(),
    });
}

pub fn list_installed_apps() -> Vec<InstalledApp> {
    let mut out = Vec::new();
    let mut seen = HashSet::new();

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    if let Ok(uninstall) =
        hklm.open_subkey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall")
    {
        for name in uninstall.enum_keys().filter_map(|k| k.ok()) {
            if let Ok(key) = uninstall.open_subkey(&name) {
                push_app(
                    format!("HKLM:native:{name}"),
                    &key,
                    "native",
                    &mut out,
                    &mut seen,
                );
            }
        }
    }

    if let Ok(uninstall) = hklm.open_subkey_with_flags(
        "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
        KEY_READ,
    ) {
        for name in uninstall.enum_keys().filter_map(|k| k.ok()) {
            if let Ok(key) = uninstall.open_subkey(&name) {
                push_app(format!("HKLM:x86:{name}"), &key, "x86", &mut out, &mut seen);
            }
        }
    }

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(uninstall) =
        hkcu.open_subkey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall")
    {
        for name in uninstall.enum_keys().filter_map(|k| k.ok()) {
            if let Ok(key) = uninstall.open_subkey(&name) {
                push_app(format!("HKCU:user:{name}"), &key, "user", &mut out, &mut seen);
            }
        }
    }

    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    out
}

fn find_app(id: &str) -> Option<InstalledApp> {
    list_installed_apps().into_iter().find(|a| a.id == id)
}

fn parse_command_line(cmd: &str) -> (String, Vec<String>) {
    let mut parts = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    for ch in cmd.chars() {
        match ch {
            '"' => in_quotes = !in_quotes,
            ' ' if !in_quotes => {
                if !current.is_empty() {
                    parts.push(std::mem::take(&mut current));
                }
            }
            _ => current.push(ch),
        }
    }
    if !current.is_empty() {
        parts.push(current);
    }
    if parts.is_empty() {
        return (cmd.to_string(), vec![]);
    }
    let exe = parts.remove(0);
    (exe, parts)
}

fn spawn_uninstaller(command: &str) -> Result<(), String> {
    let (exe, args) = parse_command_line(command);
    Command::new(&exe)
        .args(&args)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[cfg(windows)]
fn auto_click_uninstaller_buttons() {
    use uiautomation::controls::ControlType;
    use uiautomation::types::UIProperty;
    use uiautomation::variants::Variant;
    use uiautomation::{UIAutomation, UIMatcher};

    let labels = [
        "Next", "Yes", "OK", "Uninstall", "Remove", "Continue", "Finish", "Close", "Accept",
        "&Next", "&Yes", "&OK", "&Uninstall", "&Finish",
    ];

    for _ in 0..40 {
        thread::sleep(Duration::from_millis(600));
        let automation = match UIAutomation::new() {
            Ok(a) => a,
            Err(_) => continue,
        };
        let root = match automation.get_root_element() {
            Ok(r) => r,
            Err(_) => continue,
        };
        for label in labels {
            let matcher: UIMatcher = automation
                .create_matcher()
                .from(root.clone())
                .control_type(ControlType::Button)
                .name(label)
                .depth(12)
                .timeout(200);
            if let Ok(btn) = matcher.find_first() {
                let _ = btn.click();
                thread::sleep(Duration::from_millis(350));
            }
            // Also try InvokePattern via legacy property match for localized UIs
            let _ = UIProperty::Name;
            let _ = Variant::from(label);
        }
    }
}

#[cfg(not(windows))]
fn auto_click_uninstaller_buttons() {}

pub fn uninstall_app(id: &str, prefer_quiet: bool, auto_advance: bool) -> UninstallResult {
    let Some(app) = find_app(id) else {
        return UninstallResult {
            id: id.into(),
            started: false,
            mode: "none".into(),
            message: "Application not found".into(),
        };
    };

    let quiet = app.quiet_uninstall_string.clone();
    let normal = app.uninstall_string.clone();

    let (cmd, mode) = if prefer_quiet {
        if let Some(q) = quiet {
            (Some(q), "quiet")
        } else if let Some(n) = normal {
            (Some(n), "interactive")
        } else {
            (None, "none")
        }
    } else if let Some(n) = normal.or(quiet) {
        (Some(n), "interactive")
    } else {
        (None, "none")
    };

    let Some(command) = cmd else {
        return UninstallResult {
            id: id.into(),
            started: false,
            mode: mode.into(),
            message: "No uninstall command registered".into(),
        };
    };

    match spawn_uninstaller(&command) {
        Ok(()) => {
            if auto_advance && mode == "interactive" {
                thread::spawn(auto_click_uninstaller_buttons);
            }
            UninstallResult {
                id: id.into(),
                started: true,
                mode: mode.into(),
                message: format!("Started uninstaller for {}", app.name),
            }
        }
        Err(e) => UninstallResult {
            id: id.into(),
            started: false,
            mode: mode.into(),
            message: e,
        },
    }
}

pub fn uninstall_many(ids: Vec<String>, prefer_quiet: bool, auto_advance: bool) -> Vec<UninstallResult> {
    ids.into_iter()
        .map(|id| uninstall_app(&id, prefer_quiet, auto_advance))
        .collect()
}

pub fn app_size_bytes(id: &str) -> u64 {
    let Some(app) = find_app(id) else {
        return 0;
    };
    if let Some(sz) = app.estimated_size_bytes {
        return sz;
    }
    if let Some(loc) = app.install_location {
        return crate::storage::path_size(&loc);
    }
    0
}
