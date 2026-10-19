<p align="center">
  <img src="docs/readme/logo.png" width="88" alt="Kyrus Manager" />
</p>

<h1 align="center">Kyrus Manager</h1>

<p align="center">
  Native Windows system control center.<br />
  Storage, processes, disks, devices, services, firewall — one local app instead of a maze of MMC consoles.
</p>

<p align="center">
  <a href="https://github.com/arnabpluxury/kyrus-manager/stargazers"><img src="https://img.shields.io/github/stars/arnabpluxury/kyrus-manager?style=flat-square&label=stars&color=176c5b" alt="stars" /></a>
  <a href="https://github.com/arnabpluxury/kyrus-manager/network/members"><img src="https://img.shields.io/github/forks/arnabpluxury/kyrus-manager?style=flat-square&label=forks&color=366f9d" alt="forks" /></a>
  <a href="https://github.com/arnabpluxury/kyrus-manager/watchers"><img src="https://img.shields.io/github/watchers/arnabpluxury/kyrus-manager?style=flat-square&label=watchers&color=b48736" alt="watchers" /></a>
  <a href="https://github.com/arnabpluxury/kyrus-manager/issues"><img src="https://img.shields.io/github/issues/arnabpluxury/kyrus-manager?style=flat-square&label=issues&color=b54a4a" alt="issues" /></a>
  <a href="https://github.com/arnabpluxury/kyrus-manager/releases/latest"><img src="https://img.shields.io/github/v/release/arnabpluxury/kyrus-manager?style=flat-square&label=release&color=176c5b" alt="release" /></a>
  <a href="https://github.com/arnabpluxury/kyrus-manager/releases"><img src="https://img.shields.io/github/downloads/arnabpluxury/kyrus-manager/total?style=flat-square&color=366f9d" alt="downloads" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Open%20Contribution-292f2d?style=flat-square" alt="license" /></a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%2F11-b48736?style=flat-square" alt="Windows" />
</p>

<p align="center">
  <a href="https://github.com/arnabpluxury/kyrus-manager/releases/latest"><img src="https://img.shields.io/badge/Download-MSI-176c5b?style=for-the-badge&logo=windows&logoColor=white" alt="MSI" /></a>
  &nbsp;
  <a href="https://github.com/arnabpluxury/kyrus-manager/releases/latest"><img src="https://img.shields.io/badge/Download-NSIS-366f9d?style=for-the-badge&logo=windows&logoColor=white" alt="NSIS" /></a>
  &nbsp;
  <a href="https://ko-fi.com/arnabimperiale"><img src="https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi" /></a>
</p>

---

<p align="center">
  <img src="docs/readme/overview.png" alt="Overview / Control Center" width="920" />
</p>
<p align="center"><sub>Overview — live CPU, memory, processes, drives, and at-a-glance health</sub></p>

## Screenshots

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/readme/processes.png" alt="Processes" />
      <p align="center"><b>Processes</b><br /><sub>End task / tree · suspend · priority · full paths</sub></p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/readme/performance.png" alt="Performance" />
      <p align="center"><b>Performance</b><br /><sub>Live charts for CPU, memory, and I/O</sub></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/readme/services.png" alt="Services" />
      <p align="center"><b>Services</b><br /><sub>Icons · start/stop/restart · startup type · paths</sub></p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/readme/apps.png" alt="Applications" />
      <p align="center"><b>Applications</b><br /><sub>Installed apps with icons and quiet uninstall</sub></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/readme/disk-manager.png" alt="Disk Management" />
      <p align="center"><b>Disk Management</b><br /><sub>Disks, partitions, volumes · online/offline · letters</sub></p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/readme/admin-console.png" alt="Admin Console" />
      <p align="center"><b>Admin Console</b><br /><sub>Win+X tools with live Event Viewer &amp; power plans</sub></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/readme/control.png" alt="Control Center" />
      <p align="center"><b>Control Center</b><br /><sub>80+ Settings / MMC / diagnostics launchers</sub></p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/readme/bloatware.png" alt="Bloatware Free" />
      <p align="center"><b>Bloatware Free</b><br /><sub>AppX · provisioned OEM · threats · noisy services</sub></p>
    </td>
  </tr>
</table>

<p align="center">
  <img src="docs/readme/scan-progress.jpg" alt="Deep storage scan progress" width="820" />
</p>
<p align="center"><sub>Deep scans and deletes use a dimmed overlay with live percent, counts, and bytes — window stays draggable</sub></p>

## What it does

Windows already has Task Manager, Disk Management, Device Manager, Event Viewer, and Services. They work — but they are scattered, dated, and often hide detail behind elevation prompts.

Kyrus Manager keeps that work on one machine, in one cream-glass shell: real recursive folder sizes, transparent bloatware reasons, and actions that report what they did. No account. No cloud. Release builds request Administrator so protected volumes and services are reachable.

Built with **Tauri 2 · React · TypeScript · Rust**.

| Area | Capabilities |
| --- | --- |
| Storage | Deep recursive sizes, drive reconciliation, reclaim prediction, delete with progress |
| Disks | Physical disks / partitions / volumes, online·offline, read-only, letters, GPT init |
| Task Manager | Processes (suspend, end tree, priority), Performance, GPU, Services with icons |
| Admin Console | Power plans, Event logs, System About, Devices, Network adapters |
| Bloatware Free | AppX + provisioned packages + Defender hits + telemetry-ish services |
| Shell | Instant light / dark, preferences, hidden PowerShell (no console flash) |

## Install

Latest packages: [Releases](https://github.com/arnabpluxury/kyrus-manager/releases/latest)

| Asset | Notes |
| --- | --- |
| `Kyrus Manager_*_x64_en-US.msi` | Windows Installer |
| `Kyrus Manager_*-setup.exe` | NSIS wizard |

x64 only. Prefer elevated installs for full disk and service access.

## Develop

```bash
npm install
npm run tauri:dev
```

Fresh installers (clears previous MSI/NSIS first):

```bash
npm run tauri:build:fresh
```

Requires Node 20+, Rust, Windows 10/11, and WebView2.

## Project pulse

These charts update automatically as stars, commits, and traffic change.

<p align="center">
  <a href="https://star-history.com/#arnabpluxury/kyrus-manager&Date">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=arnabpluxury/kyrus-manager&type=Date&theme=dark" />
      <img src="https://api.star-history.com/chart?repos=arnabpluxury/kyrus-manager&type=Date" alt="Star history" width="820" />
    </picture>
  </a>
</p>

<p align="center">
  <a href="https://github.com/arnabpluxury/kyrus-manager">
    <img src="https://github-readme-stats.vercel.app/api/pin/?username=arnabpluxury&repo=kyrus-manager&theme=default&hide_border=true&bg_color=f5f1e8&title_color=176c5b&icon_color=366f9d&text_color=292f2d" alt="Repo card" />
  </a>
  <a href="https://github.com/arnabpluxury">
    <img src="https://github-readme-stats.vercel.app/api?username=arnabpluxury&show_icons=true&theme=default&hide_border=true&bg_color=f5f1e8&title_color=176c5b&icon_color=366f9d&text_color=292f2d&include_all_commits=true" alt="GitHub stats" height="165" />
  </a>
</p>

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=arnabpluxury&layout=compact&theme=default&hide_border=true&bg_color=f5f1e8&title_color=176c5b&text_color=292f2d" alt="Top languages" />
</p>

<p align="center">
  <a href="https://starchart.cc/arnabpluxury/kyrus-manager">
    <img src="https://starchart.cc/arnabpluxury/kyrus-manager.svg" alt="Starchart" width="820" />
  </a>
</p>

## Support

If Kyrus Manager saves you time, you can support development here:

<p align="center">
  <a href="https://ko-fi.com/arnabimperiale"><img src="https://img.shields.io/badge/Buy%20me%20a%20coffee-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Support on Ko-fi" /></a>
</p>

Same Ko-fi as [Agentic Dev Prompts](https://github.com/arnabpluxury/Agentic-Dev-Prompts). Optional — the app stays free under the project license.

## Contributing

Keep the cream-glass language, prefer real Windows APIs, and run long work on the progress overlay.  

If you modify the project and distribute those changes — or use them commercially — publish the modified sources. See [TERMS.md](TERMS.md).

## License

**Kyrus Manager Source License (Open Contribution)** — personal / non-commercial use is fine; shared or commercial modifications must be open-sourced. Full text: [LICENSE](LICENSE).

---

<p align="center">
  <a href="https://github.com/arnabpluxury/kyrus-manager/issues">Issues</a>
  ·
  <a href="https://github.com/arnabpluxury/kyrus-manager/releases">Releases</a>
  ·
  <a href="https://ko-fi.com/arnabimperiale">Ko-fi</a>
  ·
  <a href="TERMS.md">Terms</a>
</p>
