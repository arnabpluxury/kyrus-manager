# Capture live README screenshots by writing %TEMP%\kyrus-next-view.txt then launching the app.
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$exe = Join-Path $root "src-tauri\target\release\kyrus-manager.exe"
$outDir = Join-Path $root "docs\readme"
$viewFile = Join-Path $env:TEMP "kyrus-next-view.txt"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class KmCap {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT r);
  [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int W, int H, bool repaint);
  public struct RECT { public int L; public int T; public int R; public int B; }
}
"@

function Get-KmHwnd {
  $p = Get-Process | Where-Object { $_.ProcessName -eq "kyrus-manager" -and $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
  if ($null -eq $p) { return [IntPtr]::Zero }
  return [IntPtr]$p.MainWindowHandle
}

function Capture-Window([IntPtr]$hwnd, [string]$path) {
  $r = New-Object KmCap+RECT
  [void][KmCap]::GetWindowRect($hwnd, [ref]$r)
  $w = $r.R - $r.L
  $h = $r.B - $r.T
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($r.L, $r.T, 0, 0, (New-Object System.Drawing.Size $w, $h))
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "saved $path ($w x $h)"
}

Write-Host "== building release with boot-view support =="
Push-Location $root
cmd /c "npm run build"
Push-Location (Join-Path $root "src-tauri")
cmd /c "cargo build --release"
if ($LASTEXITCODE -ne 0) { throw "cargo build failed: $LASTEXITCODE" }
Pop-Location
Pop-Location

$shots = @(
  @{ View = "overview"; File = "overview.png"; Wait = 2.5 },
  @{ View = "storage"; File = "storage.png"; Wait = 6 },
  @{ View = "processes"; File = "processes.png"; Wait = 2.5 },
  @{ View = "performance"; File = "performance.png"; Wait = 2.2 },
  @{ View = "apps"; File = "apps.png"; Wait = 3.5 },
  @{ View = "services"; File = "services.png"; Wait = 4.5 },
  @{ View = "adminConsole"; File = "admin-console.png"; Wait = 3.2 },
  @{ View = "diskManager"; File = "disk-manager.png"; Wait = 4 },
  @{ View = "bloatware"; File = "bloatware.png"; Wait = 2.5 },
  @{ View = "control"; File = "control.png"; Wait = 2.2 }
)

function Stop-KmElevated {
  Start-Process -FilePath "taskkill.exe" -ArgumentList "/F","/IM","kyrus-manager.exe" -Verb RunAs -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 900
}

function Wait-KmWindow {
  $hwnd = [IntPtr]::Zero
  for ($i = 0; $i -lt 80; $i++) {
    Start-Sleep -Milliseconds 400
    $hwnd = Get-KmHwnd
    if ($hwnd -eq [IntPtr]::Zero) { continue }
    $r = New-Object KmCap+RECT
    [void][KmCap]::GetWindowRect($hwnd, [ref]$r)
    $w = $r.R - $r.L
    $h = $r.B - $r.T
    if ($w -ge 1100 -and $h -ge 700) { return $hwnd }
  }
  throw "stable window not found"
}

foreach ($s in $shots) {
  Stop-KmElevated
  Set-Content -Path $viewFile -Value $s.View -NoNewline -Encoding ascii
  Write-Host "launch $($s.View)"
  Start-Process -FilePath $exe
  $hwnd = Wait-KmWindow
  [void][KmCap]::ShowWindow($hwnd, 9)
  [void][KmCap]::MoveWindow($hwnd, 40, 40, 1400, 900, $true)
  Start-Sleep -Milliseconds 700
  [void][KmCap]::SetForegroundWindow($hwnd)
  Start-Sleep -Seconds $s.Wait
  # re-resolve hwnd after possible UAC relaunch
  $hwnd = Wait-KmWindow
  Capture-Window $hwnd (Join-Path $outDir $s.File)
}

Stop-KmElevated
Remove-Item $viewFile -Force -ErrorAction SilentlyContinue
Write-Host "capture complete"
