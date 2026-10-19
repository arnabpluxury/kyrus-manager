use crate::models::PerformanceSnapshot;
use crate::process::SYSTEM;
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use std::time::Instant;
use sysinfo::{Disks, Networks};

struct NetDiskCounters {
    rx: u64,
    tx: u64,
    read: u64,
    write: u64,
    at: Instant,
}

static PREV: Lazy<Mutex<Option<NetDiskCounters>>> = Lazy::new(|| Mutex::new(None));

pub fn snapshot() -> PerformanceSnapshot {
    let mut sys = SYSTEM.lock();
    sys.refresh_cpu_all();
    sys.refresh_memory();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let mut disks = Disks::new_with_refreshed_list();
    disks.refresh(true);
    let mut networks = Networks::new_with_refreshed_list();
    networks.refresh(true);

    let mut rx = 0u64;
    let mut tx = 0u64;
    for (_name, data) in networks.iter() {
        rx += data.total_received();
        tx += data.total_transmitted();
    }

    // Disk totals are approximate via process aggregate when OS counters unavailable.
    let mut read = 0u64;
    let mut write = 0u64;
    for (_pid, proc) in sys.processes() {
        let d = proc.disk_usage();
        read += d.total_read_bytes;
        write += d.total_written_bytes;
    }

    let now = Instant::now();
    let (rx_rate, tx_rate, read_rate, write_rate) = {
        let mut prev = PREV.lock();
        let rates = if let Some(p) = prev.as_ref() {
            let secs = now.duration_since(p.at).as_secs_f64().max(0.2);
            (
                ((rx.saturating_sub(p.rx)) as f64 / secs) as u64,
                ((tx.saturating_sub(p.tx)) as f64 / secs) as u64,
                ((read.saturating_sub(p.read)) as f64 / secs) as u64,
                ((write.saturating_sub(p.write)) as f64 / secs) as u64,
            )
        } else {
            (0, 0, 0, 0)
        };
        *prev = Some(NetDiskCounters {
            rx,
            tx,
            read,
            write,
            at: now,
        });
        rates
    };

    let cpu_usage = sys.global_cpu_usage();
    let brand = sys
        .cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "CPU".into());

    PerformanceSnapshot {
        cpu_usage,
        cpu_cores: sys.cpus().len(),
        frequency_mhz: sys.cpus().first().map(|c| c.frequency()),
        memory_total: sys.total_memory(),
        memory_used: sys.used_memory(),
        memory_available: sys.available_memory(),
        swap_total: sys.total_swap(),
        swap_used: sys.used_swap(),
        disk_read_bytes_per_sec: read_rate,
        disk_write_bytes_per_sec: write_rate,
        network_rx_bytes_per_sec: rx_rate,
        network_tx_bytes_per_sec: tx_rate,
        process_count: sys.processes().len(),
        uptime_seconds: sysinfo::System::uptime(),
        hostname: sysinfo::System::host_name().unwrap_or_else(|| "Unknown".into()),
        os_name: sysinfo::System::name().unwrap_or_else(|| "Windows".into()),
        os_version: sysinfo::System::os_version().unwrap_or_else(|| "".into()),
        cpu_brand: brand,
    }
}
