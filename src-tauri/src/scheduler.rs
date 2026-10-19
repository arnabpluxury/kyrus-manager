use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledTask {
    pub name: String,
    pub status: String,
    pub next_run: String,
    pub last_run: String,
    pub last_result: String,
    pub author: String,
    pub task_to_run: String,
    pub schedule_type: String,
}

pub fn list_tasks(limit: usize) -> Result<Vec<ScheduledTask>, String> {
    let output = crate::shellutil::run_hidden("schtasks", &["/Query", "/FO", "CSV", "/V"])?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    let text = String::from_utf8_lossy(&output.stdout);
    Ok(parse_csv(&text, limit))
}

fn parse_csv(text: &str, limit: usize) -> Vec<ScheduledTask> {
    let mut lines = text.lines().filter(|l| !l.trim().is_empty());
    let Some(header) = lines.next() else {
        return vec![];
    };
    let cols = split_csv(header);
    let idx = |name: &str| {
        cols.iter()
            .position(|c| c.eq_ignore_ascii_case(name))
            .unwrap_or(usize::MAX)
    };
    let i_name = idx("TaskName");
    let i_status = idx("Status");
    let i_next = idx("Next Run Time");
    let i_last = idx("Last Run Time");
    let i_result = idx("Last Result");
    let i_author = idx("Author");
    let i_run = idx("Task To Run");
    let i_sched = idx("Schedule Type");

    let mut out = Vec::new();
    for line in lines {
        let parts = split_csv(line);
        let get = |i: usize| parts.get(i).cloned().unwrap_or_default();
        let name = get(i_name);
        if name.is_empty() || name == "TaskName" {
            continue;
        }
        out.push(ScheduledTask {
            name,
            status: get(i_status),
            next_run: get(i_next),
            last_run: get(i_last),
            last_result: get(i_result),
            author: get(i_author),
            task_to_run: get(i_run),
            schedule_type: get(i_sched),
        });
        if out.len() >= limit {
            break;
        }
    }
    out
}

fn split_csv(line: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut cur = String::new();
    let mut in_quotes = false;
    for ch in line.chars() {
        match ch {
            '"' => in_quotes = !in_quotes,
            ',' if !in_quotes => {
                out.push(std::mem::take(&mut cur));
            }
            _ => cur.push(ch),
        }
    }
    out.push(cur);
    out
}

pub fn run_task(name: &str) -> Result<String, String> {
    let status = crate::shellutil::status_hidden("schtasks", &["/Run", "/TN", name])?;
    if status.success() {
        Ok(format!("Started task {name}"))
    } else {
        Err(format!("Failed to run task {name}"))
    }
}

pub fn end_task(name: &str) -> Result<String, String> {
    let status = crate::shellutil::status_hidden("schtasks", &["/End", "/TN", name])?;
    if status.success() {
        Ok(format!("Ended task {name}"))
    } else {
        Err(format!("Failed to end task {name}"))
    }
}

pub fn change_task(name: &str, enable: bool) -> Result<String, String> {
    let flag = if enable { "/ENABLE" } else { "/DISABLE" };
    let status = crate::shellutil::status_hidden("schtasks", &["/Change", "/TN", name, flag])?;
    if status.success() {
        Ok(format!(
            "{} task {name}",
            if enable { "Enabled" } else { "Disabled" }
        ))
    } else {
        Err(format!("Failed to change task {name}"))
    }
}
