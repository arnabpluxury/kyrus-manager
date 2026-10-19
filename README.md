# Kyrus Manager

Windows system control center — deep storage analysis, process control, GPU/firewall/scheduler/network tools, and a Control Panel launcher. Built with **Tauri 2 + React + TypeScript + Rust**.

![Kyrus Manager](src/assets/kyrus-logo.png)

## Features

- **Storage** — full recursive folder sizes (Steam, Program Files, Users, etc.), drive capacity reconciliation, predict/delete, Explorer reveal
- **Disk Analyzer** — largest files across a volume
- **Disk Treemap** — hierarchical size map
- **Temp & Junk** — discover and clean safe candidates
- **Applications** — inventory, icons, quiet multi-uninstall
- **Processes / Performance / GPU** — live telemetry and charts
- **Services, Startup, Users, Scheduler, Firewall, Network**
- **System Tools** — environment variables, power plans, recent System log errors
- **Control Center** — 80+ native Windows launches (Settings, MMC, diagnostics)

## Requirements

- Windows 10/11
- Administrator recommended for complete disk visibility (pagefile, System Volume Information)
- [Node.js 20+](https://nodejs.org/) and [Rust](https://rustup.rs/) for development

## Develop

```bash
npm install
npm run tauri dev
```

## Production installers

```bash
npm run tauri:build
```

Outputs (under `src-tauri/target/release/bundle/`):

- **MSI** — `msi/Kyrus Manager_0.2.0_x64_en-US.msi`
- **NSIS** — `nsis/Kyrus Manager_0.2.0_x64-setup.exe`

Release builds auto-elevate via UAC so storage and system APIs have full access.

## Design

Cream-glass UI from the Kyrus Manager Figma file. Tokens live in `src/styles/tokens.css`. Spec notes in `docs/KYRUS_UI_FIGMA_SPEC.md` (functionality) and `docs/VISUAL_COMPARISON.md` (visual verification).

## Contributing

Issues and PRs welcome. Keep cream-glass layout conventions when adding screens. Prefer real Windows APIs over mock data. Destructive actions must confirm and report partial failures.

## License

MIT — see [LICENSE](LICENSE).
