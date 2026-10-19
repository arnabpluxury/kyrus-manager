use serde::Serialize;
use std::process::Command;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FirewallProfile {
    pub name: String,
    pub state: String,
    pub inbound: String,
    pub outbound: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FirewallRule {
    pub name: String,
    pub enabled: String,
    pub direction: String,
    pub profiles: String,
    pub action: String,
}

pub fn list_profiles() -> Result<Vec<FirewallProfile>, String> {
    let output = Command::new("netsh")
        .args(["advfirewall", "show", "allprofiles"])
        .output()
        .map_err(|e| e.to_string())?;
    let text = String::from_utf8_lossy(&output.stdout);
    Ok(parse_profiles(&text))
}

fn parse_profiles(text: &str) -> Vec<FirewallProfile> {
    let mut profiles = Vec::new();
    let mut current: Option<FirewallProfile> = None;

    for line in text.lines() {
        let trim = line.trim();
        if trim.ends_with("Profile Settings:") {
            if let Some(p) = current.take() {
                profiles.push(p);
            }
            let name = trim.replace(" Profile Settings:", "");
            current = Some(FirewallProfile {
                name,
                state: "—".into(),
                inbound: "—".into(),
                outbound: "—".into(),
            });
            continue;
        }
        let Some(p) = current.as_mut() else { continue };
        if let Some(rest) = trim.strip_prefix("State") {
            p.state = rest.trim().trim_start_matches(':').trim().to_string();
        } else if trim.starts_with("Firewall Policy") || trim.starts_with("Inbound") {
            // "Firewall Policy                  BlockInbound,AllowOutbound"
            if let Some((_, rhs)) = trim.split_once(char::is_whitespace) {
                let rhs = rhs.trim();
                if rhs.contains(',') {
                    let parts: Vec<&str> = rhs.split(',').collect();
                    if parts.len() >= 2 {
                        p.inbound = parts[0].to_string();
                        p.outbound = parts[1].to_string();
                    }
                }
            }
        }
    }
    if let Some(p) = current {
        profiles.push(p);
    }
    profiles
}

pub fn list_rules(limit: usize) -> Result<Vec<FirewallRule>, String> {
    let output = Command::new("netsh")
        .args(["advfirewall", "firewall", "show", "rule", "name=all"])
        .output()
        .map_err(|e| e.to_string())?;
    let text = String::from_utf8_lossy(&output.stdout);
    let mut rules = Vec::new();
    let mut cur = FirewallRule {
        name: String::new(),
        enabled: String::new(),
        direction: String::new(),
        profiles: String::new(),
        action: String::new(),
    };

    for line in text.lines() {
        let trim = line.trim();
        if let Some(rest) = trim.strip_prefix("Rule Name:") {
            if !cur.name.is_empty() {
                rules.push(cur.clone());
                if rules.len() >= limit {
                    break;
                }
            }
            cur = FirewallRule {
                name: rest.trim().to_string(),
                enabled: "—".into(),
                direction: "—".into(),
                profiles: "—".into(),
                action: "—".into(),
            };
        } else if let Some(rest) = trim.strip_prefix("Enabled:") {
            cur.enabled = rest.trim().to_string();
        } else if let Some(rest) = trim.strip_prefix("Direction:") {
            cur.direction = rest.trim().to_string();
        } else if let Some(rest) = trim.strip_prefix("Profiles:") {
            cur.profiles = rest.trim().to_string();
        } else if let Some(rest) = trim.strip_prefix("Action:") {
            cur.action = rest.trim().to_string();
        }
    }
    if !cur.name.is_empty() && rules.len() < limit {
        rules.push(cur);
    }
    Ok(rules)
}

pub fn set_profile_state(profile: &str, enable: bool) -> Result<String, String> {
    let state = if enable { "on" } else { "off" };
    let profile_arg = match profile.to_lowercase().as_str() {
        "domain" => "domainprofile",
        "private" => "privateprofile",
        "public" => "publicprofile",
        "all" => "allprofiles",
        _ => return Err("Profile must be domain, private, public, or all".into()),
    };
    let status = Command::new("netsh")
        .args(["advfirewall", "set", profile_arg, "state", state])
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(format!("Firewall {profile_arg} set to {state}"))
    } else {
        Err("Failed to change firewall state".into())
    }
}
