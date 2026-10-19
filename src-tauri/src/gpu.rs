use serde::Serialize;
use std::process::Command;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GpuInfo {
    pub name: String,
    pub adapter_ram_bytes: Option<u64>,
    pub driver_version: Option<String>,
    pub driver_date: Option<String>,
    pub video_processor: Option<String>,
    pub status: Option<String>,
    pub pnp_device_id: Option<String>,
    pub vendor: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NvidiaSnapshot {
    pub available: bool,
    pub raw: String,
    pub gpus: Vec<NvidiaGpu>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NvidiaGpu {
    pub index: String,
    pub name: String,
    pub utilization_gpu: Option<String>,
    pub utilization_mem: Option<String>,
    pub memory_total: Option<String>,
    pub memory_used: Option<String>,
    pub temperature: Option<String>,
    pub power_draw: Option<String>,
    pub power_limit: Option<String>,
    pub fan_speed: Option<String>,
    pub clocks_graphics: Option<String>,
}

pub fn list_gpus() -> Vec<GpuInfo> {
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM,DriverVersion,DriverDate,VideoProcessor,Status,PNPDeviceID | ConvertTo-Json -Compress",
        ])
        .output();

    let Ok(out) = output else {
        return vec![];
    };
    if !out.status.success() {
        return vec![];
    }
    let text = String::from_utf8_lossy(&out.stdout);
    parse_wmi_gpus(&text)
}

fn parse_wmi_gpus(text: &str) -> Vec<GpuInfo> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return vec![];
    }
    let value: serde_json::Value = match serde_json::from_str(trimmed) {
        Ok(v) => v,
        Err(_) => return vec![],
    };
    let arr = if value.is_array() {
        value.as_array().cloned().unwrap_or_default()
    } else {
        vec![value]
    };

    arr.into_iter()
        .filter_map(|v| {
            let name = v.get("Name")?.as_str()?.to_string();
            let pnp = v
                .get("PNPDeviceID")
                .and_then(|x| x.as_str())
                .map(|s| s.to_string());
            let vendor = detect_vendor(&name, pnp.as_deref());
            Some(GpuInfo {
                name,
                adapter_ram_bytes: v
                    .get("AdapterRAM")
                    .and_then(|x| x.as_u64().or_else(|| x.as_i64().map(|n| n as u64))),
                driver_version: v
                    .get("DriverVersion")
                    .and_then(|x| x.as_str())
                    .map(|s| s.to_string()),
                driver_date: v
                    .get("DriverDate")
                    .and_then(|x| x.as_str())
                    .map(|s| s.to_string()),
                video_processor: v
                    .get("VideoProcessor")
                    .and_then(|x| x.as_str())
                    .map(|s| s.to_string()),
                status: v
                    .get("Status")
                    .and_then(|x| x.as_str())
                    .map(|s| s.to_string()),
                pnp_device_id: pnp,
                vendor,
            })
        })
        .collect()
}

fn detect_vendor(name: &str, pnp: Option<&str>) -> String {
    let hay = format!("{} {}", name, pnp.unwrap_or("")).to_lowercase();
    if hay.contains("nvidia") || hay.contains("ven_10de") {
        "NVIDIA".into()
    } else if hay.contains("amd") || hay.contains("radeon") || hay.contains("ven_1002") {
        "AMD".into()
    } else if hay.contains("intel") || hay.contains("ven_8086") {
        "Intel".into()
    } else {
        "Unknown".into()
    }
}

pub fn nvidia_snapshot() -> NvidiaSnapshot {
    let output = Command::new("nvidia-smi")
        .args([
            "--query-gpu=index,name,utilization.gpu,utilization.memory,memory.total,memory.used,temperature.gpu,power.draw,power.limit,fan.speed,clocks.current.graphics",
            "--format=csv,noheader,nounits",
        ])
        .output();

    let Ok(out) = output else {
        return NvidiaSnapshot {
            available: false,
            raw: "nvidia-smi not found".into(),
            gpus: vec![],
        };
    };
    let raw = String::from_utf8_lossy(&out.stdout).to_string();
    if !out.status.success() {
        return NvidiaSnapshot {
            available: false,
            raw: String::from_utf8_lossy(&out.stderr).to_string(),
            gpus: vec![],
        };
    }

    let gpus: Vec<NvidiaGpu> = raw
        .lines()
        .filter(|l| !l.trim().is_empty())
        .map(|line| {
            let parts: Vec<&str> = line.split(',').map(|s| s.trim()).collect();
            NvidiaGpu {
                index: parts.first().unwrap_or(&"0").to_string(),
                name: parts.get(1).unwrap_or(&"").to_string(),
                utilization_gpu: parts.get(2).map(|s| s.to_string()),
                utilization_mem: parts.get(3).map(|s| s.to_string()),
                memory_total: parts.get(4).map(|s| s.to_string()),
                memory_used: parts.get(5).map(|s| s.to_string()),
                temperature: parts.get(6).map(|s| s.to_string()),
                power_draw: parts.get(7).map(|s| s.to_string()),
                power_limit: parts.get(8).map(|s| s.to_string()),
                fan_speed: parts.get(9).map(|s| s.to_string()),
                clocks_graphics: parts.get(10).map(|s| s.to_string()),
            }
        })
        .collect();

    NvidiaSnapshot {
        available: !gpus.is_empty(),
        raw,
        gpus,
    }
}
