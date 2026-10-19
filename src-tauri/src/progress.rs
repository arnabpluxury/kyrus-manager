use serde::Serialize;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobProgress {
    pub job: String,
    pub phase: String,
    pub detail: String,
    pub current: u64,
    pub total: u64,
    pub bytes_so_far: u64,
    pub percent: f64,
    pub indeterminate: bool,
}

pub struct ProgressEmitter {
    app: AppHandle,
    job: String,
    last: Mutex<Instant>,
    min_interval: Duration,
}

impl ProgressEmitter {
    pub fn new(app: AppHandle, job: impl Into<String>) -> Self {
        Self {
            app,
            job: job.into(),
            last: Mutex::new(Instant::now() - Duration::from_secs(1)),
            min_interval: Duration::from_millis(90),
        }
    }

    pub fn emit(
        &self,
        phase: &str,
        detail: &str,
        current: u64,
        total: u64,
        bytes_so_far: u64,
        force: bool,
    ) {
        let percent = if total == 0 {
            0.0
        } else {
            ((current as f64 / total as f64) * 100.0).clamp(0.0, 99.5)
        };
        let indeterminate = total == 0;
        if !force {
            if let Ok(mut last) = self.last.lock() {
                if last.elapsed() < self.min_interval {
                    return;
                }
                *last = Instant::now();
            }
        }
        let _ = self.app.emit(
            "job-progress",
            JobProgress {
                job: self.job.clone(),
                phase: phase.into(),
                detail: detail.into(),
                current,
                total,
                bytes_so_far,
                percent,
                indeterminate,
            },
        );
    }

    pub fn finish(&self, detail: &str) {
        let _ = self.app.emit(
            "job-progress",
            JobProgress {
                job: self.job.clone(),
                phase: "done".into(),
                detail: detail.into(),
                current: 1,
                total: 1,
                bytes_so_far: 0,
                percent: 100.0,
                indeterminate: false,
            },
        );
    }
}
