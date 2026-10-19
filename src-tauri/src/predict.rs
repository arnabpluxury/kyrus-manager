use crate::models::{PredictRequest, PredictionItem, SpacePrediction};
use crate::storage::{list_drives, path_size};

pub fn predict(req: PredictRequest) -> SpacePrediction {
    let mut items = Vec::new();

    if let Some(paths) = req.paths {
        for path in paths {
            let bytes = path_size(&path);
            items.push(PredictionItem {
                label: path.clone(),
                path: Some(path),
                bytes,
                kind: "path".into(),
            });
        }
    }

    if let Some(temps) = req.temp_paths {
        for path in temps {
            let bytes = path_size(&path);
            items.push(PredictionItem {
                label: path.clone(),
                path: Some(path),
                bytes,
                kind: "temp".into(),
            });
        }
    }

    if let Some(app_ids) = req.app_ids {
        for id in app_ids {
            let bytes = crate::apps::app_size_bytes(&id);
            items.push(PredictionItem {
                label: id.clone(),
                path: None,
                bytes,
                kind: "app".into(),
            });
        }
    }

    let reclaimable: u64 = items.iter().map(|i| i.bytes).sum();
    let drives = list_drives();
    let primary = drives
        .iter()
        .find(|d| d.mount_point.to_uppercase().starts_with("C:"))
        .or_else(|| drives.first());

    let (drive, free, total) = match primary {
        Some(d) => (d.mount_point.clone(), d.free_bytes, d.total_bytes),
        None => ("C:\\".into(), 0, 0),
    };

    let free_after = free.saturating_add(reclaimable);
    let used_after = total.saturating_sub(free_after);
    let used_after_percent = if total == 0 {
        0.0
    } else {
        (used_after as f64 / total as f64) * 100.0
    };

    SpacePrediction {
        current_free_bytes: free,
        reclaimable_bytes: reclaimable,
        free_after_bytes: free_after,
        used_after_percent,
        drive,
        items,
    }
}
