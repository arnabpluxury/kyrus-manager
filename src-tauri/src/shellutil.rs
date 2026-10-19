//! Hidden process helpers — no flashing consoles (CREATE_NO_WINDOW).

use std::process::{Command, Output, Stdio};

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Apply no-window flags on Windows; pass-through elsewhere.
pub fn hide(cmd: &mut Command) -> &mut Command {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(CREATE_NO_WINDOW)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
    }
    #[cfg(not(windows))]
    {
        let _ = cmd;
    }
    cmd
}

pub fn powershell_output(script: &str) -> Result<Output, String> {
    let mut cmd = Command::new("powershell");
    hide(&mut cmd);
    cmd.args([
        "-NoProfile",
        "-NonInteractive",
        "-WindowStyle",
        "Hidden",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script,
    ])
    .output()
    .map_err(|e| e.to_string())
}

pub fn powershell_json(script: &str) -> Result<String, String> {
    let output = powershell_output(script)?;
    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr).trim().to_string();
        if !err.is_empty() {
            return Err(err);
        }
        return Err("PowerShell command failed".into());
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

pub fn run_hidden(program: &str, args: &[&str]) -> Result<Output, String> {
    let mut cmd = Command::new(program);
    hide(&mut cmd);
    cmd.args(args).output().map_err(|e| e.to_string())
}

pub fn status_hidden(program: &str, args: &[&str]) -> Result<std::process::ExitStatus, String> {
    let mut cmd = Command::new(program);
    hide(&mut cmd);
    cmd.args(args).status().map_err(|e| e.to_string())
}
