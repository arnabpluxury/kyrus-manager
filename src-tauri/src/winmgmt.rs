//! In-app replacements for Win+X / Computer Management surfaces
//! (Disk Management, Device Manager, System, Events, Network adapters).
//! Mapped from native Taskmgr.exe + dmdskmgr.dll / *.msc inventory (REA PE).

use crate::shellutil;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PhysicalDisk {
    pub number: i32,
    pub friendly_name: String,
    pub size_bytes: u64,
    pub partition_style: String,
    pub operational_status: String,
    pub health_status: String,
    pub bus_type: String,
    pub is_system: bool,
    pub is_boot: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskPartition {
    pub disk_number: i32,
    pub partition_number: i32,
    pub drive_letter: String,
    pub size_bytes: u64,
    pub partition_type: String,
    pub is_system: bool,
    pub is_boot: bool,
    pub is_active: bool,
    pub gpt_type: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VolumeInfo {
    pub drive_letter: String,
    pub label: String,
    pub file_system: String,
    pub size_bytes: u64,
    pub free_bytes: u64,
    pub health_status: String,
    pub drive_type: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskInventory {
    pub disks: Vec<PhysicalDisk>,
    pub partitions: Vec<DiskPartition>,
    pub volumes: Vec<VolumeInfo>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceEntry {
    pub instance_id: String,
    pub name: String,
    pub class: String,
    pub status: String,
    pub present: bool,
    pub problem: String,
    pub manufacturer: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemAbout {
    pub computer_name: String,
    pub user_name: String,
    pub os_name: String,
    pub os_version: String,
    pub os_build: String,
    pub manufacturer: String,
    pub model: String,
    pub processor: String,
    pub total_memory_bytes: u64,
    pub system_type: String,
    pub bios_version: String,
    pub domain: String,
    pub install_date: String,
    pub last_boot: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EventLogEntry {
    pub time: String,
    pub level: String,
    pub log_name: String,
    pub source: String,
    pub event_id: String,
    pub message: String,
}

fn ps_json(script: &str) -> Result<String, String> {
    shellutil::powershell_json(script)
}

fn parse_json_array<T: for<'de> Deserialize<'de>>(text: &str) -> Result<Vec<T>, String> {
    if text.is_empty() || text == "null" {
        return Ok(vec![]);
    }
    if text.starts_with('{') {
        let one: T = serde_json::from_str(text).map_err(|e| e.to_string())?;
        return Ok(vec![one]);
    }
    serde_json::from_str(text).map_err(|e| e.to_string())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct PsDisk {
    number: Option<i32>,
    friendly_name: Option<String>,
    size: Option<u64>,
    partition_style: Option<String>,
    operational_status: Option<String>,
    health_status: Option<String>,
    bus_type: Option<String>,
    is_system: Option<bool>,
    is_boot: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct PsPart {
    disk_number: Option<i32>,
    partition_number: Option<i32>,
    drive_letter: Option<String>,
    size: Option<u64>,
    #[serde(rename = "Type")]
    partition_type: Option<String>,
    is_system: Option<bool>,
    is_boot: Option<bool>,
    is_active: Option<bool>,
    gpt_type: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct PsVol {
    drive_letter: Option<String>,
    file_system_label: Option<String>,
    file_system: Option<String>,
    size: Option<u64>,
    size_remaining: Option<u64>,
    health_status: Option<String>,
    drive_type: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct PsDev {
    instance_id: Option<String>,
    friendly_name: Option<String>,
    class: Option<String>,
    status: Option<String>,
    present: Option<bool>,
    problem: Option<String>,
    manufacturer: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct PsAbout {
    computer_name: Option<String>,
    user_name: Option<String>,
    os_name: Option<String>,
    os_version: Option<String>,
    os_build: Option<String>,
    manufacturer: Option<String>,
    model: Option<String>,
    processor: Option<String>,
    total_memory_bytes: Option<u64>,
    system_type: Option<String>,
    bios_version: Option<String>,
    domain: Option<String>,
    install_date: Option<String>,
    last_boot: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct PsEvt {
    time: Option<String>,
    level: Option<String>,
    log_name: Option<String>,
    source: Option<String>,
    event_id: Option<String>,
    message: Option<String>,
}

pub fn disk_inventory() -> Result<DiskInventory, String> {
    let script = r#"
$ErrorActionPreference='SilentlyContinue'
$disks = @(Get-Disk | ForEach-Object {
  [PSCustomObject]@{
    Number=$_.Number; FriendlyName=$_.FriendlyName; Size=[uint64]$_.Size;
    PartitionStyle="$($_.PartitionStyle)"; OperationalStatus="$($_.OperationalStatus)";
    HealthStatus="$($_.HealthStatus)"; BusType="$($_.BusType)";
    IsSystem=[bool]$_.IsSystem; IsBoot=[bool]$_.IsBoot
  }
})
$parts = @(Get-Partition | ForEach-Object {
  $letter = if ($_.DriveLetter) { [string]$_.DriveLetter } else { '' }
  [PSCustomObject]@{
    DiskNumber=$_.DiskNumber; PartitionNumber=$_.PartitionNumber; DriveLetter=$letter;
    Size=[uint64]$_.Size; Type="$($_.Type)"; IsSystem=[bool]$_.IsSystem; IsBoot=[bool]$_.IsBoot;
    IsActive=[bool]$_.IsActive; GptType="$($_.GptType)"
  }
})
$vols = @(Get-Volume | Where-Object { $_.DriveLetter -or $_.FileSystemLabel } | ForEach-Object {
  $letter = if ($_.DriveLetter) { [string]$_.DriveLetter } else { '' }
  [PSCustomObject]@{
    DriveLetter=$letter; FileSystemLabel="$($_.FileSystemLabel)"; FileSystem="$($_.FileSystem)";
    Size=[uint64]($_.Size); SizeRemaining=[uint64]($_.SizeRemaining);
    HealthStatus="$($_.HealthStatus)"; DriveType="$($_.DriveType)"
  }
})
[PSCustomObject]@{ Disks=$disks; Partitions=$parts; Volumes=$vols } | ConvertTo-Json -Depth 5 -Compress
"#;
    let text = ps_json(script)?;
    #[derive(Deserialize)]
    #[serde(rename_all = "PascalCase")]
    struct Wrap {
        disks: Option<Vec<PsDisk>>,
        partitions: Option<Vec<PsPart>>,
        volumes: Option<Vec<PsVol>>,
    }
    let wrap: Wrap = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    Ok(DiskInventory {
        disks: wrap
            .disks
            .unwrap_or_default()
            .into_iter()
            .map(|d| PhysicalDisk {
                number: d.number.unwrap_or(-1),
                friendly_name: d.friendly_name.unwrap_or_else(|| "Disk".into()),
                size_bytes: d.size.unwrap_or(0),
                partition_style: d.partition_style.unwrap_or_default(),
                operational_status: d.operational_status.unwrap_or_default(),
                health_status: d.health_status.unwrap_or_default(),
                bus_type: d.bus_type.unwrap_or_default(),
                is_system: d.is_system.unwrap_or(false),
                is_boot: d.is_boot.unwrap_or(false),
            })
            .collect(),
        partitions: wrap
            .partitions
            .unwrap_or_default()
            .into_iter()
            .map(|p| DiskPartition {
                disk_number: p.disk_number.unwrap_or(-1),
                partition_number: p.partition_number.unwrap_or(-1),
                drive_letter: p.drive_letter.unwrap_or_default(),
                size_bytes: p.size.unwrap_or(0),
                partition_type: p.partition_type.unwrap_or_default(),
                is_system: p.is_system.unwrap_or(false),
                is_boot: p.is_boot.unwrap_or(false),
                is_active: p.is_active.unwrap_or(false),
                gpt_type: p.gpt_type.unwrap_or_default(),
            })
            .collect(),
        volumes: wrap
            .volumes
            .unwrap_or_default()
            .into_iter()
            .map(|v| VolumeInfo {
                drive_letter: v.drive_letter.unwrap_or_default(),
                label: v.file_system_label.unwrap_or_default(),
                file_system: v.file_system.unwrap_or_default(),
                size_bytes: v.size.unwrap_or(0),
                free_bytes: v.size_remaining.unwrap_or(0),
                health_status: v.health_status.unwrap_or_default(),
                drive_type: v.drive_type.unwrap_or_default(),
            })
            .collect(),
    })
}

pub fn set_disk_online(number: i32, online: bool) -> Result<String, String> {
    let cmd = if online {
        format!("Set-Disk -Number {number} -IsOffline $false")
    } else {
        format!("Set-Disk -Number {number} -IsOffline $true")
    };
    let _ = ps_json(&format!("{cmd}; 'ok'"))?;
    Ok(if online {
        format!("Disk {number} set online")
    } else {
        format!("Disk {number} set offline")
    })
}

pub fn set_disk_readonly(number: i32, read_only: bool) -> Result<String, String> {
    let flag = if read_only { "$true" } else { "$false" };
    let _ = ps_json(&format!(
        "Set-Disk -Number {number} -IsReadOnly {flag}; 'ok'"
    ))?;
    Ok(format!(
        "Disk {number} read-only = {read_only}"
    ))
}

pub fn list_devices(class_filter: Option<String>) -> Result<Vec<DeviceEntry>, String> {
    let filter = class_filter
        .filter(|s| !s.trim().is_empty() && s != "All")
        .map(|s| s.replace('\'', "''"))
        .unwrap_or_default();
    let where_cls = if filter.is_empty() {
        String::new()
    } else {
        format!("| Where-Object {{ $_.Class -eq '{filter}' }}")
    };
    let script = format!(
        r#"
$ErrorActionPreference='SilentlyContinue'
@(Get-PnpDevice {where_cls} | Select-Object -First 800 | ForEach-Object {{
  [PSCustomObject]@{{
    InstanceId=$_.InstanceId; FriendlyName=("$($_.FriendlyName)"); Class=("$($_.Class)");
    Status=("$($_.Status)"); Present=[bool]$_.Present; Problem=("$($_.Problem)");
    Manufacturer=("$($_.Manufacturer)")
  }}
}}) | ConvertTo-Json -Compress
"#
    );
    let text = ps_json(&script)?;
    let rows: Vec<PsDev> = parse_json_array(&text)?;
    Ok(rows
        .into_iter()
        .map(|d| DeviceEntry {
            instance_id: d.instance_id.unwrap_or_default(),
            name: d.friendly_name.unwrap_or_else(|| "Unknown device".into()),
            class: d.class.unwrap_or_default(),
            status: d.status.unwrap_or_default(),
            present: d.present.unwrap_or(false),
            problem: d.problem.unwrap_or_default(),
            manufacturer: d.manufacturer.unwrap_or_default(),
        })
        .collect())
}

pub fn set_device_enabled(instance_id: &str, enable: bool) -> Result<String, String> {
    let id = instance_id.replace('\'', "''");
    let cmd = if enable {
        format!("Enable-PnpDevice -InstanceId '{id}' -Confirm:$false")
    } else {
        format!("Disable-PnpDevice -InstanceId '{id}' -Confirm:$false")
    };
    let _ = ps_json(&format!("{cmd}; 'ok'"))?;
    Ok(if enable {
        "Device enabled".into()
    } else {
        "Device disabled".into()
    })
}

pub fn system_about() -> Result<SystemAbout, String> {
    let script = r#"
$ErrorActionPreference='SilentlyContinue'
$os = Get-CimInstance Win32_OperatingSystem
$cs = Get-CimInstance Win32_ComputerSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$bios = Get-CimInstance Win32_BIOS
[PSCustomObject]@{
  ComputerName=$env:COMPUTERNAME
  UserName=$env:USERNAME
  OsName=$os.Caption
  OsVersion=$os.Version
  OsBuild=$os.BuildNumber
  Manufacturer=$cs.Manufacturer
  Model=$cs.Model
  Processor=$cpu.Name
  TotalMemoryBytes=[uint64]$cs.TotalPhysicalMemory
  SystemType=$cs.SystemType
  BiosVersion=("$($bios.SMBIOSBIOSVersion)")
  Domain=$cs.Domain
  InstallDate=($os.InstallDate.ToString('s'))
  LastBoot=($os.LastBootUpTime.ToString('s'))
} | ConvertTo-Json -Compress
"#;
    let text = ps_json(script)?;
    let a: PsAbout = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    Ok(SystemAbout {
        computer_name: a.computer_name.unwrap_or_default(),
        user_name: a.user_name.unwrap_or_default(),
        os_name: a.os_name.unwrap_or_default(),
        os_version: a.os_version.unwrap_or_default(),
        os_build: a.os_build.unwrap_or_default(),
        manufacturer: a.manufacturer.unwrap_or_default(),
        model: a.model.unwrap_or_default(),
        processor: a.processor.unwrap_or_default(),
        total_memory_bytes: a.total_memory_bytes.unwrap_or(0),
        system_type: a.system_type.unwrap_or_default(),
        bios_version: a.bios_version.unwrap_or_default(),
        domain: a.domain.unwrap_or_default(),
        install_date: a.install_date.unwrap_or_default(),
        last_boot: a.last_boot.unwrap_or_default(),
    })
}

pub fn list_events(log: &str, limit: usize, level: Option<String>) -> Result<Vec<EventLogEntry>, String> {
    let lim = limit.clamp(1, 300);
    let log_name = match log {
        "Application" | "Security" | "Setup" => log,
        _ => "System",
    };
    let level_filter = match level.as_deref() {
        Some("Error") => " | Where-Object { $_.LevelDisplayName -match 'Error|Critical' }",
        Some("Warning") => " | Where-Object { $_.LevelDisplayName -match 'Warning|Error|Critical' }",
        Some("All") | None => "",
        Some(other) => {
            return Err(format!("Unknown level filter: {other}"));
        }
    };
    let script = format!(
        r#"
$ErrorActionPreference='SilentlyContinue'
@(Get-WinEvent -LogName '{log_name}' -MaxEvents {lim} -ErrorAction SilentlyContinue{level_filter} | Select-Object -First {lim} | ForEach-Object {{
  $msg = if ($_.Message) {{ ($_.Message -replace '[\r\n]+',' ').Substring(0,[Math]::Min(280,$_.Message.Length)) }} else {{ '' }}
  [PSCustomObject]@{{
    Time=$_.TimeCreated.ToString('s'); Level=$_.LevelDisplayName; LogName='{log_name}';
    Source=$_.ProviderName; EventId=[string]$_.Id; Message=$msg
  }}
}}) | ConvertTo-Json -Compress
"#
    );
    let text = ps_json(&script)?;
    let rows: Vec<PsEvt> = parse_json_array(&text)?;
    Ok(rows
        .into_iter()
        .map(|e| EventLogEntry {
            time: e.time.unwrap_or_default(),
            level: e.level.unwrap_or_default(),
            log_name: e.log_name.unwrap_or_else(|| log_name.into()),
            source: e.source.unwrap_or_default(),
            event_id: e.event_id.unwrap_or_default(),
            message: e.message.unwrap_or_default(),
        })
        .collect())
}

pub fn set_adapter_enabled(name: &str, enable: bool) -> Result<String, String> {
    let n = name.replace('\'', "''");
    let cmd = if enable {
        format!("Enable-NetAdapter -Name '{n}' -Confirm:$false")
    } else {
        format!("Disable-NetAdapter -Name '{n}' -Confirm:$false")
    };
    let _ = ps_json(&format!("{cmd}; 'ok'"))?;
    Ok(if enable {
        format!("Adapter '{name}' enabled")
    } else {
        format!("Adapter '{name}' disabled")
    })
}

pub fn rescan_disks() -> Result<String, String> {
    let _ = ps_json("Update-HostStorageCache; Get-Disk | Out-Null; 'ok'")?;
    Ok("Disks rescanned".into())
}

pub fn assign_drive_letter(disk_number: i32, partition_number: i32, letter: &str) -> Result<String, String> {
    let letter_ch = letter.trim().chars().next().ok_or("Letter required")?;
    if !letter_ch.is_ascii_alphabetic() {
        return Err("Drive letter must be A–Z".into());
    }
    let script = format!(
        "Get-Partition -DiskNumber {disk_number} -PartitionNumber {partition_number} | Set-Partition -NewDriveLetter {letter_ch}; 'ok'"
    );
    let _ = ps_json(&script)?;
    Ok(format!(
        "Assigned {letter_ch}: to disk {disk_number} partition {partition_number}"
    ))
}

pub fn remove_drive_letter(disk_number: i32, partition_number: i32) -> Result<String, String> {
    let script = format!(
        r#"
$p = Get-Partition -DiskNumber {disk_number} -PartitionNumber {partition_number}
if ($p.DriveLetter) {{
  $path = "$($p.DriveLetter):"
  Remove-PartitionAccessPath -DiskNumber {disk_number} -PartitionNumber {partition_number} -AccessPath $path
}}
'ok'
"#
    );
    let _ = ps_json(&script)?;
    Ok(format!("Removed drive letter from disk {disk_number} partition {partition_number}"))
}

pub fn initialize_disk(number: i32, style: &str) -> Result<String, String> {
    let style = match style.to_lowercase().as_str() {
        "mbr" => "MBR",
        _ => "GPT",
    };
    let script = format!(
        "Initialize-Disk -Number {number} -PartitionStyle {style} -Confirm:$false; 'ok'"
    );
    let _ = ps_json(&script)?;
    Ok(format!("Initialized disk {number} as {style}"))
}

pub fn open_volume(letter: &str) -> Result<String, String> {
    let letter_ch = letter
        .trim()
        .trim_end_matches(':')
        .chars()
        .next()
        .ok_or("Letter required")?;
    crate::system_extra::reveal_in_explorer(&format!("{letter_ch}:\\"))
}
