## Kyrus Manager 0.2.0

First public build of the Windows system control center. Replaces scattered MMC / Settings surfaces with one local app: storage analysis, process control, disk and device management, Win+X admin tools, and bloatware cleanup.

### Install

| File | Notes |
| --- | --- |
| `Kyrus Manager_0.2.0_x64_en-US.msi` | Windows Installer package (x64) |
| `Kyrus Manager_0.2.0_x64-setup.exe` | NSIS setup wizard (x64) |

Run elevated when you need full disk visibility and service / OEM package control. WebView2 is required (included on current Windows 10/11).

### What's in this release

**Storage & cleanup**
- Recursive deep scans with live progress (percent, item counts, bytes)
- Drive capacity reconciliation and reclaim prediction
- Temp / junk discovery and multi-delete with progress

**Task Manager stand-ins**
- Processes: end task, end process tree, suspend / resume, priority, path reveal
- Performance and GPU views
- Services with binary icons, start / stop / restart / pause, startup type

**Admin Console (Win+X)**
- Power plans, Event Viewer (System / Application / Security / Setup), System About
- Device Manager enable / disable
- Disk Management: disks, partitions, volumes, online / offline, letters, GPT init
- Network adapter enable / disable

**Bloatware Free**
- Scan AppX, provisioned packages, Defender detections, and noisy services
- Transparent reasons for every flag; selective uninstall / remediate

**App shell**
- Preferences: instant light / dark theme, gradients, compact navigation
- Hidden PowerShell / CLI work (no console flash)
- Control Center: 80+ Settings and MMC launchers

### License

Open Contribution — personal / non-commercial use is fine. If you modify and distribute (or use commercially), publish the modified sources. See `LICENSE` and `TERMS.md` in the repository.

### Verify

After install, open **Storage**, run a deep scan on `C:\`, and confirm large trees appear with the progress overlay while sizing.
