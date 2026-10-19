use crate::models::TempCandidate;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use walkdir::WalkDir;

fn age_days(path: &Path) -> u64 {
    let modified = fs::metadata(path)
        .and_then(|m| m.modified())
        .unwrap_or(SystemTime::now());
    let secs = modified
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(secs);
    now.saturating_sub(secs) / 86_400
}

fn push_candidates(root: PathBuf, category: &str, safe: bool, out: &mut Vec<TempCandidate>) {
    if !root.exists() {
        return;
    }
    let walker = WalkDir::new(&root).max_depth(3).into_iter();
    for entry in walker.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path == root {
            continue;
        }
        let meta = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        let size = if meta.is_file() {
            meta.len()
        } else if meta.is_dir() {
            WalkDir::new(path)
                .max_depth(2)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().is_file())
                .filter_map(|e| e.metadata().ok())
                .map(|m| m.len())
                .sum()
        } else {
            0
        };
        if size < 64 * 1024 {
            continue;
        }
        out.push(TempCandidate {
            path: path.to_string_lossy().to_string(),
            name: path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default(),
            size_bytes: size,
            category: category.into(),
            age_days: age_days(path),
            safe_to_delete: safe,
        });
    }
}

pub fn discover_temp() -> Vec<TempCandidate> {
    let mut out = Vec::new();
    let mut roots: Vec<(PathBuf, &str, bool)> = Vec::new();

    if let Ok(tmp) = std::env::var("TEMP") {
        roots.push((PathBuf::from(tmp), "User Temp", true));
    }
    if let Ok(tmp) = std::env::var("TMP") {
        roots.push((PathBuf::from(tmp), "User TMP", true));
    }
    roots.push((PathBuf::from(r"C:\Windows\Temp"), "Windows Temp", true));
    roots.push((
        PathBuf::from(r"C:\Windows\SoftwareDistribution\Download"),
        "Windows Update Cache",
        true,
    ));
    roots.push((
        PathBuf::from(r"C:\Windows\Prefetch"),
        "Prefetch",
        false,
    ));

    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        roots.push((
            PathBuf::from(&local).join("Temp"),
            "LocalAppData Temp",
            true,
        ));
        roots.push((
            PathBuf::from(&local).join("Microsoft").join("Windows").join("INetCache"),
            "Browser Cache",
            true,
        ));
        roots.push((
            PathBuf::from(&local).join("CrashDumps"),
            "Crash Dumps",
            true,
        ));
    }

    if let Ok(home) = std::env::var("USERPROFILE") {
        roots.push((
            PathBuf::from(&home).join("AppData").join("Local").join("Temp"),
            "Profile Temp",
            true,
        ));
        roots.push((
            PathBuf::from(&home).join("Downloads"),
            "Downloads (large)",
            false,
        ));
    }

    for (root, category, safe) in roots {
        push_candidates(root, category, safe, &mut out);
    }

    out.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    out.truncate(500);
    out
}
