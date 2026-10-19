//! Bloatware Free Operation — transparent scan of junk AppX, provisioned
//! packages, OEM clutter, Defender threats, and optional telemetry services.

use crate::progress::ProgressEmitter;
use crate::shellutil;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BloatItem {
    pub id: String,
    pub name: String,
    pub kind: String,
    pub publisher: String,
    pub version: String,
    pub size_bytes: u64,
    pub reason: String,
    pub severity: String,
    pub removable: bool,
    pub provisioned: bool,
    pub path: String,
    pub details: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BloatScanResult {
    pub items: Vec<BloatItem>,
    pub scanned_packages: u64,
    pub threat_count: u64,
    pub bloat_count: u64,
    pub reclaimable_bytes: u64,
    pub elevated: bool,
    pub notes: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BloatRemoveResult {
    pub id: String,
    pub ok: bool,
    pub message: String,
}

fn ps_json(script: &str) -> Result<String, String> {
    shellutil::powershell_json(script)
}

fn parse_array<T: for<'de> Deserialize<'de>>(text: &str) -> Result<Vec<T>, String> {
    if text.is_empty() || text == "null" {
        return Ok(vec![]);
    }
    if text.starts_with('{') {
        let one: T = serde_json::from_str(text).map_err(|e| e.to_string())?;
        return Ok(vec![one]);
    }
    serde_json::from_str(text).map_err(|e| e.to_string())
}

/// Known consumer / OEM / Store packages that commonly waste resources.
const BLOAT_PATTERNS: &[&str] = &[
    "Microsoft.BingNews",
    "Microsoft.BingWeather",
    "Microsoft.BingSearch",
    "Microsoft.GetHelp",
    "Microsoft.Getstarted",
    "Microsoft.MicrosoftOfficeHub",
    "Microsoft.MicrosoftSolitaireCollection",
    "Microsoft.People",
    "Microsoft.SkypeApp",
    "Microsoft.WindowsFeedbackHub",
    "Microsoft.XboxApp",
    "Microsoft.Xbox.TCUI",
    "Microsoft.XboxGameOverlay",
    "Microsoft.XboxGamingOverlay",
    "Microsoft.XboxIdentityProvider",
    "Microsoft.XboxSpeechToTextOverlay",
    "Microsoft.GamingApp",
    "Microsoft.ZuneMusic",
    "Microsoft.ZuneVideo",
    "Microsoft.YourPhone",
    "Microsoft.WindowsMaps",
    "Microsoft.WindowsSoundRecorder",
    "Microsoft.MixedReality.Portal",
    "Microsoft.Microsoft3DViewer",
    "Microsoft.Print3D",
    "Microsoft.OneConnect",
    "Microsoft.549981C3F5F10", // Cortana
    "Clipchamp.Clipchamp",
    "Microsoft.Todos",
    "Microsoft.PowerAutomateDesktop",
    "MicrosoftTeams",
    "MSTeams",
    "Microsoft.OutlookForWindows",
    "MicrosoftCorporationII.QuickAssist",
    "MicrosoftWindows.Client.WebExperience",
    "Microsoft.Windows.DevHome",
    "Microsoft.GamingServices",
    "Disney",
    "Spotify",
    "TikTok",
    "Facebook",
    "Instagram",
    "Netflix",
    "PrimeVideo",
    "LinkedIn",
    "CandyCrush",
    "BubbleWitch",
    "MarchofEmpires",
    "RoyalRevolt",
    "FarmVille",
    "Asphalt",
    "Dolby",
    "McAfee",
    "Norton",
    "WildTangent",
    "Booking",
    "AdobeNotificationClient",
    "king.com",
];

fn classify_package(name: &str) -> Option<(String, String)> {
    let lower = name.to_lowercase();
    for pat in BLOAT_PATTERNS {
        if lower.contains(&pat.to_lowercase()) {
            let severity = if pat.contains("Xbox")
                || pat.contains("Bing")
                || pat.contains("Candy")
                || pat.contains("McAfee")
                || pat.contains("Teams")
            {
                "high"
            } else {
                "medium"
            };
            return Some((
                format!("Matches known bloat pattern: {pat}"),
                severity.into(),
            ));
        }
    }
    None
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct PsPkg {
    name: Option<String>,
    package_full_name: Option<String>,
    publisher: Option<String>,
    version: Option<String>,
    install_location: Option<String>,
    is_framework: Option<bool>,
    signature_kind: Option<String>,
    provisioned: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct PsThreat {
    threat_name: Option<String>,
    #[allow(dead_code)]
    severity: Option<String>,
    resources: Option<String>,
    status: Option<String>,
    detection_id: Option<String>,
}

pub fn scan_bloatware(progress: Option<&ProgressEmitter>) -> Result<BloatScanResult, String> {
    if let Some(p) = progress {
        p.emit("scanning", "Enumerating AppX packages", 0, 0, 0, true);
    }

    let script = r#"
$ErrorActionPreference='SilentlyContinue'
$pkgs = @(Get-AppxPackage -AllUsers -ErrorAction SilentlyContinue | ForEach-Object {
  [PSCustomObject]@{
    Name=$_.Name; PackageFullName=$_.PackageFullName; Publisher=$_.Publisher;
    Version="$($_.Version)"; InstallLocation="$($_.InstallLocation)";
    IsFramework=[bool]$_.IsFramework; SignatureKind="$($_.SignatureKind)"; Provisioned=$false
  }
})
$prov = @(Get-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue | ForEach-Object {
  [PSCustomObject]@{
    Name=$_.DisplayName; PackageFullName=$_.PackageName; Publisher='Provisioned';
    Version="$($_.Version)"; InstallLocation=''; IsFramework=$false; SignatureKind='Store'; Provisioned=$true
  }
})
@($pkgs + $prov) | ConvertTo-Json -Compress
"#;
    let text = ps_json(script).unwrap_or_else(|_| "[]".into());
    let pkgs: Vec<PsPkg> = parse_array(&text).unwrap_or_default();
    let scanned = pkgs.len() as u64;

    if let Some(p) = progress {
        p.emit(
            "classifying",
            &format!("{scanned} packages found"),
            0,
            scanned.max(1),
            0,
            true,
        );
    }

    let mut items = Vec::new();
    let mut reclaimable = 0u64;
    for (i, pkg) in pkgs.iter().enumerate() {
        let name = pkg.name.clone().unwrap_or_default();
        if pkg.is_framework.unwrap_or(false) {
            continue;
        }
        // Never flag core system shells
        let critical = [
            "Microsoft.WindowsStore",
            "Microsoft.WindowsCalculator",
            "Microsoft.Windows.Photos",
            "Microsoft.WindowsNotepad",
            "Microsoft.DesktopAppInstaller",
            "Microsoft.WindowsTerminal",
            "Microsoft.UI.Xaml",
            "Microsoft.VCLibs",
            "Microsoft.NET",
            "windows.immersivecontrolpanel",
            "Microsoft.Windows.ShellExperienceHost",
            "Microsoft.Windows.StartMenuExperienceHost",
            "Microsoft.LockApp",
            "Microsoft.SecHealthUI",
        ];
        if critical.iter().any(|c| name.eq_ignore_ascii_case(c) || name.starts_with(c)) {
            continue;
        }
        if let Some((reason, severity)) = classify_package(&name) {
            let id = pkg
                .package_full_name
                .clone()
                .unwrap_or_else(|| format!("pkg:{name}"));
            let provisioned = pkg.provisioned.unwrap_or(false);
            items.push(BloatItem {
                id: id.clone(),
                name: name.clone(),
                kind: if provisioned {
                    "provisioned".into()
                } else {
                    "appx".into()
                },
                publisher: pkg.publisher.clone().unwrap_or_default(),
                version: pkg.version.clone().unwrap_or_default(),
                size_bytes: 0,
                reason,
                severity,
                removable: true,
                provisioned,
                path: pkg.install_location.clone().unwrap_or_default(),
                details: pkg.signature_kind.clone().unwrap_or_default(),
            });
        }
        if let Some(p) = progress {
            if i % 25 == 0 {
                p.emit(
                    "classifying",
                    &name,
                    i as u64 + 1,
                    scanned.max(1),
                    reclaimable,
                    false,
                );
            }
        }
    }

    if let Some(p) = progress {
        p.emit("threats", "Querying Microsoft Defender detections", 0, 0, 0, true);
    }

    let threat_script = r#"
$ErrorActionPreference='SilentlyContinue'
@(Get-MpThreatDetection -ErrorAction SilentlyContinue | Select-Object -First 100 | ForEach-Object {
  [PSCustomObject]@{
    ThreatName=("$($_.ThreatName)"); Severity=("$($_.SeverityID)");
    Resources=(($($_.Resources) | Out-String).Trim()); Status=("$($_.CurrentThreatExecutionStatusID)");
    DetectionId=("$($_.DetectionID)")
  }
}) | ConvertTo-Json -Compress
"#;
    let threat_text = ps_json(threat_script).unwrap_or_else(|_| "[]".into());
    let threats: Vec<PsThreat> = parse_array(&threat_text).unwrap_or_default();
    let threat_count = threats.len() as u64;
    for t in threats {
        let name = t.threat_name.unwrap_or_else(|| "Unknown threat".into());
        let id = format!(
            "threat:{}",
            t.detection_id.unwrap_or_else(|| name.clone())
        );
        items.push(BloatItem {
            id,
            name: name.clone(),
            kind: "threat".into(),
            publisher: "Microsoft Defender".into(),
            version: String::new(),
            size_bytes: 0,
            reason: "Defender threat detection — review and remediate".into(),
            severity: "critical".into(),
            removable: true,
            provisioned: false,
            path: t.resources.unwrap_or_default(),
            details: t.status.unwrap_or_default(),
        });
    }

    // Telemetry / bloat services that can be disabled (not uninstalled)
    let service_script = r#"
$ErrorActionPreference='SilentlyContinue'
$names = @('DiagTrack','dmwappushservice','SysMain','WSearch','RetailDemo','XboxGipSvc','XblAuthManager','XblGameSave','XboxNetApiSvc')
@(Get-Service -Name $names -ErrorAction SilentlyContinue | ForEach-Object {
  [PSCustomObject]@{ Name=$_.Name; DisplayName=$_.DisplayName; Status="$($_.Status)"; StartType="$($_.StartType)" }
}) | ConvertTo-Json -Compress
"#;
    #[derive(Deserialize)]
    #[serde(rename_all = "PascalCase")]
    struct PsSvc {
        name: Option<String>,
        display_name: Option<String>,
        status: Option<String>,
        start_type: Option<String>,
    }
    if let Ok(svc_text) = ps_json(service_script) {
        if let Ok(svcs) = parse_array::<PsSvc>(&svc_text) {
            for s in svcs {
                let name = s.name.unwrap_or_default();
                let start = s.start_type.unwrap_or_default();
                if start.eq_ignore_ascii_case("Disabled") {
                    continue;
                }
                items.push(BloatItem {
                    id: format!("svc:{name}"),
                    name: s.display_name.unwrap_or_else(|| name.clone()),
                    kind: "service".into(),
                    publisher: "Windows".into(),
                    version: start.clone(),
                    size_bytes: 0,
                    reason: format!(
                        "Background service often tied to telemetry/indexing/Xbox ({})",
                        s.status.unwrap_or_default()
                    ),
                    severity: "low".into(),
                    removable: true,
                    provisioned: false,
                    path: name,
                    details: format!("StartType={start}"),
                });
            }
        }
    }

    items.sort_by(|a, b| {
        severity_rank(&b.severity)
            .cmp(&severity_rank(&a.severity))
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    let bloat_count = items.iter().filter(|i| i.kind != "threat").count() as u64;
    reclaimable = items.iter().map(|i| i.size_bytes).sum();

    let elevated = crate::admin::is_elevated();
    let mut notes = vec![
        "Every item is listed with reason — nothing is removed until you select and confirm.".into(),
        "AppX removals use Remove-AppxPackage / Remove-AppxProvisionedPackage (admin recommended).".into(),
        "Core system packages (Store, Photos, Calculator, Shell) are never flagged.".into(),
    ];
    if !elevated {
        notes.push("Not elevated — run as Administrator to remove provisioned OEM packages and disable protected services.".into());
    }

    if let Some(p) = progress {
        p.finish(&format!(
            "{} items · {} threats",
            items.len(),
            threat_count
        ));
    }

    Ok(BloatScanResult {
        items,
        scanned_packages: scanned,
        threat_count,
        bloat_count,
        reclaimable_bytes: reclaimable,
        elevated,
        notes,
    })
}

fn severity_rank(s: &str) -> u8 {
    match s {
        "critical" => 4,
        "high" => 3,
        "medium" => 2,
        "low" => 1,
        _ => 0,
    }
}

pub fn remove_bloat_items(ids: Vec<String>) -> Vec<BloatRemoveResult> {
    ids.into_iter()
        .map(|id| {
            let res = remove_one(&id);
            match res {
                Ok(msg) => BloatRemoveResult {
                    id,
                    ok: true,
                    message: msg,
                },
                Err(e) => BloatRemoveResult {
                    id,
                    ok: false,
                    message: e,
                },
            }
        })
        .collect()
}

fn remove_one(id: &str) -> Result<String, String> {
    if let Some(name) = id.strip_prefix("svc:") {
        let n = name.replace('\'', "''");
        let _ = ps_json(&format!(
            "Stop-Service -Name '{n}' -Force -ErrorAction SilentlyContinue; Set-Service -Name '{n}' -StartupType Disabled; 'ok'"
        ))?;
        return Ok(format!("Service {name} stopped and disabled"));
    }
    if id.starts_with("threat:") {
        let _ = ps_json(
            "Start-MpScan -ScanType QuickScan -ErrorAction SilentlyContinue; 'ok'",
        )?;
        return Ok("Started Defender quick scan for threat remediation".into());
    }
    // AppX / provisioned
    let safe = id.replace('\'', "''");
    let script = format!(
        r#"
$ErrorActionPreference='Stop'
$id = '{safe}'
try {{
  $pkg = Get-AppxPackage -AllUsers | Where-Object {{ $_.PackageFullName -eq $id -or $_.Name -eq $id }} | Select-Object -First 1
  if ($pkg) {{
    Remove-AppxPackage -Package $pkg.PackageFullName -AllUsers -ErrorAction SilentlyContinue
    Remove-AppxPackage -Package $pkg.PackageFullName -ErrorAction SilentlyContinue
    'removed-appx'
  }} else {{
    $prov = Get-AppxProvisionedPackage -Online | Where-Object {{ $_.PackageName -eq $id -or $_.DisplayName -eq $id }} | Select-Object -First 1
    if ($prov) {{
      Remove-AppxProvisionedPackage -Online -PackageName $prov.PackageName | Out-Null
      'removed-provisioned'
    }} else {{
      throw 'Package not found'
    }}
  }}
}} catch {{
  throw $_.Exception.Message
}}
"#
    );
    let out = ps_json(&script)?;
    Ok(format!("Removed ({out})"))
}
