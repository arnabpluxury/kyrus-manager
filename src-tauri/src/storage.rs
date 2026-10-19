use crate::models::{DriveInfo, ScanOptions, StorageEntry, StorageScanResult};
use rayon::prelude::*;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;
use walkdir::{DirEntry, WalkDir};

#[cfg(windows)]
pub fn list_drives() -> Vec<DriveInfo> {
    use windows::Win32::Storage::FileSystem::{
        GetDiskFreeSpaceExW, GetDriveTypeW, GetLogicalDriveStringsW, GetVolumeInformationW,
    };
    const DRIVE_REMOVABLE: u32 = 2;
    const DRIVE_FIXED: u32 = 3;
    const DRIVE_REMOTE: u32 = 4;
    const DRIVE_CDROM: u32 = 5;
    const DRIVE_RAMDISK: u32 = 6;

    let mut buffer = vec![0u16; 256];
    let len = unsafe { GetLogicalDriveStringsW(Some(&mut buffer)) };
    if len == 0 {
        return fallback_drives();
    }

    let mut drives = Vec::new();
    let mut start = 0usize;
    while start < len as usize {
        while start < buffer.len() && buffer[start] == 0 {
            start += 1;
        }
        if start >= len as usize {
            break;
        }
        let end = buffer[start..]
            .iter()
            .position(|&c| c == 0)
            .map(|i| start + i)
            .unwrap_or(buffer.len());
        let root = String::from_utf16_lossy(&buffer[start..end]);
        start = end + 1;
        if root.is_empty() {
            continue;
        }

        let root_wide: Vec<u16> = root.encode_utf16().chain(Some(0)).collect();
        let drive_type = unsafe { GetDriveTypeW(windows::core::PCWSTR(root_wide.as_ptr())) };
        let type_label = match drive_type {
            DRIVE_REMOVABLE => "Removable",
            DRIVE_FIXED => "Fixed",
            DRIVE_REMOTE => "Network",
            DRIVE_CDROM => "Optical",
            DRIVE_RAMDISK => "RAM",
            _ => "Unknown",
        };

        let mut free: u64 = 0;
        let mut total: u64 = 0;
        let mut total_free: u64 = 0;
        let ok = unsafe {
            GetDiskFreeSpaceExW(
                windows::core::PCWSTR(root_wide.as_ptr()),
                Some(&mut free),
                Some(&mut total),
                Some(&mut total_free),
            )
        };
        if ok.is_err() || total == 0 {
            continue;
        }
        let used = total.saturating_sub(free);
        let used_percent = (used as f64 / total as f64) * 100.0;

        let mut fs_name = [0u16; 64];
        let mut vol_name = [0u16; 64];
        let _ = unsafe {
            GetVolumeInformationW(
                windows::core::PCWSTR(root_wide.as_ptr()),
                Some(&mut vol_name),
                None,
                None,
                None,
                Some(&mut fs_name),
            )
        };
        let label = String::from_utf16_lossy(&vol_name)
            .trim_matches('\0')
            .to_string();
        let fs = String::from_utf16_lossy(&fs_name)
            .trim_matches('\0')
            .to_string();
        let name = if label.is_empty() {
            format!("Local Disk ({})", root.trim_end_matches('\\'))
        } else {
            format!("{} ({})", label, root.trim_end_matches('\\'))
        };

        drives.push(DriveInfo {
            name,
            mount_point: root,
            file_system: if fs.is_empty() { "Unknown".into() } else { fs },
            total_bytes: total,
            used_bytes: used,
            free_bytes: free,
            used_percent,
            is_removable: drive_type == DRIVE_REMOVABLE,
            drive_type: type_label.into(),
        });
    }
    drives
}

#[cfg(not(windows))]
pub fn list_drives() -> Vec<DriveInfo> {
    fallback_drives()
}

fn fallback_drives() -> Vec<DriveInfo> {
    let mut sys = sysinfo::Disks::new_with_refreshed_list();
    sys.refresh(true);
    sys.list()
        .iter()
        .map(|d| {
            let total = d.total_space();
            let free = d.available_space();
            let used = total.saturating_sub(free);
            DriveInfo {
                name: d.name().to_string_lossy().to_string(),
                mount_point: d.mount_point().to_string_lossy().to_string(),
                file_system: d.file_system().to_string_lossy().to_string(),
                total_bytes: total,
                used_bytes: used,
                free_bytes: free,
                used_percent: if total == 0 {
                    0.0
                } else {
                    (used as f64 / total as f64) * 100.0
                },
                is_removable: d.is_removable(),
                drive_type: format!("{:?}", d.kind()),
            }
        })
        .collect()
}

fn categorize(path: &Path, is_dir: bool) -> String {
    let lower = path.to_string_lossy().to_lowercase();
    if lower.contains("\\steam\\")
        || lower.contains("\\steamapps\\")
        || lower.contains("\\steamlibrary")
        || lower.contains("\\epic games\\")
        || lower.contains("\\riot games\\")
        || lower.contains("\\origin\\")
        || lower.contains("\\ea games\\")
        || lower.contains("\\ubisoft\\")
        || lower.contains("\\gog galaxy\\")
        || lower.contains("\\xboxgames\\")
        || lower.contains("\\battle.net\\")
    {
        return "Games".into();
    }
    if lower.contains("\\temp\\")
        || lower.contains("/temp/")
        || lower.contains("\\tmp\\")
        || lower.ends_with("\\temp")
        || lower.contains("\\temporary internet files\\")
        || lower.contains("\\cache\\")
        || lower.contains("\\caches\\")
    {
        return "Temp".into();
    }
    if lower.contains("\\windows\\")
        || lower.contains("\\system32\\")
        || lower.contains("\\system volume information")
        || lower.contains("\\$recycle.bin")
        || lower.ends_with("\\pagefile.sys")
        || lower.ends_with("\\hiberfil.sys")
        || lower.ends_with("\\swapfile.sys")
    {
        return "System".into();
    }
    if lower.contains("\\program files") || lower.contains("\\programdata\\") {
        return "Applications".into();
    }
    if lower.contains("\\users\\") && lower.contains("\\downloads\\") {
        return "Downloads".into();
    }
    if lower.contains("\\users\\")
        && (lower.contains("\\documents\\")
            || lower.contains("\\desktop\\")
            || lower.contains("\\pictures\\")
            || lower.contains("\\videos\\")
            || lower.contains("\\music\\")
            || lower.contains("\\appdata\\"))
    {
        return "User Data".into();
    }
    if is_dir {
        return "Folder".into();
    }
    match path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase()
        .as_str()
    {
        "exe" | "msi" | "msix" | "appx" => "Executables".into(),
        "mp4" | "mkv" | "avi" | "mov" | "wmv" | "webm" => "Videos".into(),
        "mp3" | "flac" | "wav" | "aac" | "ogg" => "Audio".into(),
        "jpg" | "jpeg" | "png" | "gif" | "webp" | "bmp" | "tiff" => "Images".into(),
        "zip" | "rar" | "7z" | "tar" | "gz" | "iso" | "vhd" | "vhdx" => "Archives".into(),
        "dll" | "sys" | "drv" => "Libraries".into(),
        "log" | "tmp" | "bak" | "old" | "cache" => "Junk".into(),
        _ => "Other".into(),
    }
}

fn is_reparse_point(entry: &DirEntry) -> bool {
    entry.path_is_symlink()
        || entry
            .metadata()
            .map(|m| m.file_type().is_symlink())
            .unwrap_or(false)
}

/// Full recursive size — no depth cap. Skips reparse points to avoid double-counting.
/// Counts inaccessible paths via `denied`.
pub fn dir_size_full(path: &Path, denied: &AtomicU64) -> u64 {
    if path.is_file() {
        return fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    }
    let mut total = 0u64;
    let walker = WalkDir::new(path)
        .follow_links(false)
        .same_file_system(false)
        .into_iter();
    for entry in walker {
        match entry {
            Ok(e) => {
                if is_reparse_point(&e) && e.depth() > 0 {
                    continue;
                }
                if e.file_type().is_file() {
                    if let Ok(meta) = e.metadata() {
                        total = total.saturating_add(meta.len());
                    } else {
                        denied.fetch_add(1, Ordering::Relaxed);
                    }
                }
            }
            Err(_) => {
                denied.fetch_add(1, Ordering::Relaxed);
            }
        }
    }
    total
}

pub fn path_size(path: &str) -> u64 {
    let p = Path::new(path);
    if !p.exists() {
        return 0;
    }
    let denied = AtomicU64::new(0);
    dir_size_full(p, &denied)
}

pub fn scan_storage(options: ScanOptions) -> Result<StorageScanResult, String> {
    let root = PathBuf::from(&options.root);
    if !root.exists() {
        return Err(format!("Path does not exist: {}", options.root));
    }

    // Listing is always one level of children. Folder *sizes* are always fully recursive
    // when deep=true (default). Shallow is only for quick previews.
    let deep = options.deep.unwrap_or(true);
    let max_entries = options.max_entries.unwrap_or(2000);
    let min_size = options.min_size_bytes.unwrap_or(0);
    let sort_by = options.sort_by.unwrap_or_else(|| "size".into());
    let sort_desc = options.sort_desc.unwrap_or(true);
    let filter_exts = options
        .extensions
        .map(|v| {
            v.into_iter()
                .map(|e| e.trim_start_matches('.').to_lowercase())
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    let category_filter = options.category.unwrap_or_default();
    let shallow_depth = options.max_depth.unwrap_or(2).max(1);

    let started = Instant::now();
    let denied = AtomicU64::new(0);

    let children: Vec<PathBuf> = if root.is_file() {
        vec![root.clone()]
    } else {
        // Include normal + hidden + system entries Windows exposes via read_dir
        let mut list: Vec<PathBuf> = fs::read_dir(&root)
            .map_err(|e| e.to_string())?
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .collect();
        // Explicitly probe common large root files that may be missed when locked
        for name in ["pagefile.sys", "hiberfil.sys", "swapfile.sys"] {
            let p = root.join(name);
            if p.exists() && !list.iter().any(|x| x == &p) {
                list.push(p);
            }
        }
        list
    };

    let mut entries: Vec<StorageEntry> = children
        .par_iter()
        .filter_map(|path| {
            let meta = match fs::metadata(path) {
                Ok(m) => m,
                Err(_) => {
                    denied.fetch_add(1, Ordering::Relaxed);
                    return None;
                }
            };
            let is_dir = meta.is_dir();
            let size = if is_dir {
                if deep {
                    dir_size_full(path, &denied)
                } else {
                    // Quick preview: still walk, but capped depth for responsiveness
                    WalkDir::new(path)
                        .max_depth(shallow_depth)
                        .follow_links(false)
                        .into_iter()
                        .filter_map(|e| e.ok())
                        .filter(|e| e.file_type().is_file())
                        .filter_map(|e| e.metadata().ok())
                        .map(|m| m.len())
                        .sum()
                }
            } else {
                meta.len()
            };
            if size < min_size {
                return None;
            }
            let ext = path
                .extension()
                .and_then(|e| e.to_str())
                .map(|s| s.to_lowercase());
            if !filter_exts.is_empty() {
                match &ext {
                    Some(e) if filter_exts.iter().any(|f| f == e) => {}
                    _ if !is_dir => return None,
                    _ => {}
                }
            }
            let category = categorize(path, is_dir);
            if !category_filter.is_empty()
                && !category.eq_ignore_ascii_case(&category_filter)
                && category_filter != "All"
            {
                return None;
            }
            let modified = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs() as i64);
            Some(StorageEntry {
                path: path.to_string_lossy().to_string(),
                name: path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| path.to_string_lossy().to_string()),
                size_bytes: size,
                is_dir,
                category,
                modified,
                extension: ext,
            })
        })
        .collect();

    match sort_by.as_str() {
        "name" => entries.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase())),
        "modified" => entries.sort_by(|a, b| a.modified.cmp(&b.modified)),
        "category" => entries.sort_by(|a, b| a.category.cmp(&b.category)),
        _ => entries.sort_by(|a, b| a.size_bytes.cmp(&b.size_bytes)),
    }
    if sort_desc {
        entries.reverse();
    }

    let truncated = entries.len() > max_entries;
    entries.truncate(max_entries);
    let total_scanned_bytes = entries.iter().map(|e| e.size_bytes).sum();
    let file_count = entries.iter().filter(|e| !e.is_dir).count() as u64;
    let dir_count = entries.iter().filter(|e| e.is_dir).count() as u64;

    // Reconcile against volume capacity when scanning a drive root
    let drive = list_drives()
        .into_iter()
        .find(|d| {
            let mp = d.mount_point.trim_end_matches('\\').to_lowercase();
            let r = options.root.trim_end_matches('\\').to_lowercase();
            mp == r || options.root.to_lowercase().starts_with(&d.mount_point.to_lowercase())
        });
    let drive_used_bytes = drive.as_ref().map(|d| d.used_bytes);
    let drive_total_bytes = drive.as_ref().map(|d| d.total_bytes);
    let drive_free_bytes = drive.as_ref().map(|d| d.free_bytes);
    let unaccounted_bytes = drive_used_bytes.map(|used| used.saturating_sub(total_scanned_bytes));

    Ok(StorageScanResult {
        root: options.root,
        entries,
        total_scanned_bytes,
        file_count,
        dir_count,
        elapsed_ms: started.elapsed().as_millis() as u64,
        truncated,
        inaccessible_count: denied.load(Ordering::Relaxed),
        drive_used_bytes,
        drive_total_bytes,
        drive_free_bytes,
        unaccounted_bytes,
        deep,
    })
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LargeFile {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub category: String,
    pub extension: Option<String>,
}

/// Walk an entire tree and return the largest files (not folders).
pub fn find_largest_files(root: &str, limit: usize, min_size_bytes: u64) -> Result<Vec<LargeFile>, String> {
    let path = PathBuf::from(root);
    if !path.exists() {
        return Err(format!("Path does not exist: {root}"));
    }
    let mut files: Vec<LargeFile> = Vec::new();
    for entry in WalkDir::new(&path).follow_links(false).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_file() {
            continue;
        }
        if is_reparse_point(&entry) {
            continue;
        }
        let Ok(meta) = entry.metadata() else { continue };
        let size = meta.len();
        if size < min_size_bytes {
            continue;
        }
        let p = entry.path();
        files.push(LargeFile {
            path: p.to_string_lossy().to_string(),
            name: p
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default(),
            size_bytes: size,
            category: categorize(p, false),
            extension: p.extension().and_then(|e| e.to_str()).map(|s| s.to_lowercase()),
        });
    }
    files.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    files.truncate(limit.max(1));
    Ok(files)
}

pub fn delete_paths(paths: Vec<String>) -> crate::models::DeleteResult {
    use crate::models::{DeleteFailure, DeleteResult};
    let mut deleted = Vec::new();
    let mut failed = Vec::new();
    let mut freed = 0u64;

    for path in paths {
        let size = path_size(&path);
        let p = Path::new(&path);
        let result = if p.is_dir() {
            fs::remove_dir_all(p)
        } else {
            fs::remove_file(p)
        };
        match result {
            Ok(()) => {
                freed += size;
                deleted.push(path);
            }
            Err(e) => failed.push(DeleteFailure {
                path,
                error: e.to_string(),
            }),
        }
    }

    DeleteResult {
        deleted,
        failed,
        freed_bytes: freed,
    }
}
