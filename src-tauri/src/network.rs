use serde::Serialize;
use std::process::Command;
use sysinfo::Networks;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkAdapter {
    pub name: String,
    pub received_bytes: u64,
    pub transmitted_bytes: u64,
    pub packets_received: u64,
    pub packets_transmitted: u64,
    pub errors_on_received: u64,
    pub errors_on_transmitted: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IpConfigEntry {
    pub adapter: String,
    pub details: String,
}

pub fn list_adapters() -> Vec<NetworkAdapter> {
    let mut nets = Networks::new_with_refreshed_list();
    nets.refresh(true);
    nets.iter()
        .map(|(name, data)| NetworkAdapter {
            name: name.clone(),
            received_bytes: data.total_received(),
            transmitted_bytes: data.total_transmitted(),
            packets_received: data.total_packets_received(),
            packets_transmitted: data.total_packets_transmitted(),
            errors_on_received: data.total_errors_on_received(),
            errors_on_transmitted: data.total_errors_on_transmitted(),
        })
        .collect()
}

pub fn ipconfig_all() -> Result<Vec<IpConfigEntry>, String> {
    let output = Command::new("ipconfig")
        .args(["/all"])
        .output()
        .map_err(|e| e.to_string())?;
    let text = String::from_utf8_lossy(&output.stdout);
    let mut entries = Vec::new();
    let mut current_name = String::from("General");
    let mut buf = String::new();

    for line in text.lines() {
        if !line.starts_with(' ') && !line.starts_with('\t') && line.trim().ends_with(':') {
            if !buf.trim().is_empty() {
                entries.push(IpConfigEntry {
                    adapter: current_name.clone(),
                    details: buf.trim().to_string(),
                });
            }
            current_name = line.trim().trim_end_matches(':').to_string();
            buf.clear();
        } else if !line.trim().is_empty() {
            buf.push_str(line.trim());
            buf.push('\n');
        }
    }
    if !buf.trim().is_empty() {
        entries.push(IpConfigEntry {
            adapter: current_name,
            details: buf.trim().to_string(),
        });
    }
    Ok(entries)
}

pub fn release_renew() -> Result<String, String> {
    let _ = Command::new("ipconfig").args(["/release"]).status();
    let status = Command::new("ipconfig")
        .args(["/renew"])
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok("IP release/renew completed".into())
    } else {
        Err("IP renew failed".into())
    }
}
