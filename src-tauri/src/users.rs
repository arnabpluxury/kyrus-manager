use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSession {
    pub username: String,
    pub session_name: String,
    pub id: String,
    pub state: String,
    pub idle_time: String,
    pub logon_time: String,
}

pub fn list_sessions() -> Result<Vec<UserSession>, String> {
    let output = crate::shellutil::run_hidden("query", &["user"])
        .or_else(|_| crate::shellutil::run_hidden("quser", &[]))?;

    // quser writes to stdout even when "success"; sometimes stderr has data on non-English
    let text = if output.stdout.is_empty() {
        String::from_utf8_lossy(&output.stderr).to_string()
    } else {
        String::from_utf8_lossy(&output.stdout).to_string()
    };

    let mut sessions = Vec::new();
    for line in text.lines().skip(1) {
        let cols: Vec<&str> = line.split_whitespace().collect();
        if cols.len() < 4 {
            continue;
        }
        // Formats vary: USERNAME SESSIONNAME ID STATE IDLE TIME LOGON TIME
        let username = cols[0].trim_start_matches('>').to_string();
        let (session_name, id, state, rest_start) = if cols[1].chars().all(|c| c.is_ascii_digit()) {
            ("—".into(), cols[1].to_string(), cols[2].to_string(), 3)
        } else {
            (
                cols[1].to_string(),
                cols.get(2).unwrap_or(&"—").to_string(),
                cols.get(3).unwrap_or(&"—").to_string(),
                4,
            )
        };
        let idle = cols.get(rest_start).unwrap_or(&"—").to_string();
        let logon = cols
            .get(rest_start + 1..)
            .map(|s| s.join(" "))
            .unwrap_or_else(|| "—".into());
        sessions.push(UserSession {
            username,
            session_name,
            id,
            state,
            idle_time: idle,
            logon_time: logon,
        });
    }
    Ok(sessions)
}

pub fn list_local_users() -> Result<Vec<String>, String> {
    let output = crate::shellutil::run_hidden("net", &["user"])?;
    let text = String::from_utf8_lossy(&output.stdout);
    let mut users = Vec::new();
    let mut capture = false;
    for line in text.lines() {
        if line.contains("-----") {
            capture = true;
            continue;
        }
        if !capture {
            continue;
        }
        if line.contains("The command completed") {
            break;
        }
        for name in line.split_whitespace() {
            if !name.is_empty() {
                users.push(name.to_string());
            }
        }
    }
    Ok(users)
}
