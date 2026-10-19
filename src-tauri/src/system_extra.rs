//! Extra system-level helpers: environment, power plans, recent event errors.

use crate::shellutil;
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvVar {
    pub name: String,
    pub value: String,
    pub scope: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PowerPlan {
    pub guid: String,
    pub name: String,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EventEntry {
    pub time: String,
    pub level: String,
    pub source: String,
    pub event_id: String,
    pub message: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct PsEvent {
    time: String,
    level: String,
    source: String,
    event_id: String,
    message: String,
}

pub fn list_env_vars() -> Vec<EnvVar> {
    let mut out = Vec::new();
    for (name, value) in std::env::vars() {
        out.push(EnvVar {
            name,
            value,
            scope: "Process".into(),
        });
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    out
}

pub fn list_power_plans() -> Result<Vec<PowerPlan>, String> {
    let output = shellutil::run_hidden("powercfg", &["/list"])?;
    let text = String::from_utf8_lossy(&output.stdout);
    let mut plans = Vec::new();
    for line in text.lines() {
        // Example: Power Scheme GUID: 381b4222-...  (Balanced) *
        if !line.to_lowercase().contains("guid") {
            continue;
        }
        let active = line.contains('*');
        let guid = line
            .split_whitespace()
            .find(|t| t.len() == 36 && t.contains('-'))
            .unwrap_or("")
            .to_string();
        let name = line
            .find('(')
            .and_then(|s| line[s + 1..].find(')').map(|e| line[s + 1..s + 1 + e].to_string()))
            .unwrap_or_else(|| "Unknown".into());
        if guid.is_empty() {
            continue;
        }
        plans.push(PowerPlan { guid, name, active });
    }
    Ok(plans)
}

pub fn set_power_plan(guid: &str) -> Result<String, String> {
    let status = shellutil::status_hidden("powercfg", &["/setactive", guid])?;
    if status.success() {
        Ok(format!("Active power plan set to {guid}"))
    } else {
        Err("powercfg /setactive failed".into())
    }
}

pub fn recent_errors(limit: usize) -> Result<Vec<EventEntry>, String> {
    let lim = limit.clamp(1, 200);
    let ps = format!(
        "Get-WinEvent -LogName System -MaxEvents {lim} -ErrorAction SilentlyContinue | Where-Object {{ $_.LevelDisplayName -match 'Error|Warning|Critical' }} | Select-Object -First {lim} | ForEach-Object {{ [PSCustomObject]@{{ Time=$_.TimeCreated.ToString('s'); Level=$_.LevelDisplayName; Source=$_.ProviderName; EventId=$_.Id; Message=($_.Message -replace '[\\r\\n]+',' ' ).Substring(0,[Math]::Min(240,$_.Message.Length)) }} }} | ConvertTo-Json -Compress"
    );
    let text = shellutil::powershell_json(&ps)?;
    if text.is_empty() || text == "null" {
        return Ok(vec![]);
    }
    let map = |e: PsEvent| EventEntry {
        time: e.time,
        level: e.level,
        source: e.source,
        event_id: e.event_id,
        message: e.message,
    };
    if text.starts_with('{') {
        let one: PsEvent = serde_json::from_str(&text).map_err(|e| e.to_string())?;
        return Ok(vec![map(one)]);
    }
    let rows: Vec<PsEvent> = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(map).collect())
}

/// Open Explorer at a path (or select a file).
pub fn reveal_in_explorer(path: &str) -> Result<String, String> {
    let p = std::path::Path::new(path);
    if !p.exists() {
        return Err(format!("Path does not exist: {path}"));
    }
    if p.is_file() {
        Command::new("explorer")
            .args(["/select,", path])
            .spawn()
            .map_err(|e| e.to_string())?;
    } else {
        Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(format!("Opened Explorer for {path}"))
}
