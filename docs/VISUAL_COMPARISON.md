# Kyrus Manager — Visual comparison report

Figma file: `xg2ffkP3WzKVp6UxFPwrdo` (account `arnabpluxury@gmail.com`)  
Reference frames: 1440 × 900 cream glass workspace screens.

## Reference captures

All core screen references are stored under `docs/figma-refs/`:

| Screen | Node | File |
|---|---|---|
| Overview | 7:998 | overview.png |
| Storage | 7:1425 | storage.png |
| Disk Treemap | 7:1814 | treemap.png |
| Temp & Junk | 7:2029 | cleanup.png |
| Applications | 7:2567 | apps.png |
| Processes | 8:774 | processes.png |
| Performance | 8:1314 | performance.png |
| GPU | 8:1756 | gpu.png |
| Services | 8:2007 | services.png |
| Startup | 8:2374 | startup.png |
| Users & Sessions | 8:2769 | users.png |
| Task Scheduler | 9:1646 | scheduler.png |
| Firewall | 9:2038 | firewall.png |
| Network | 9:2412 | network.png |
| Control Center | 9:2705 | control.png |

## Implementation status vs Figma

Verified against Overview design context + screenshot (geometry, tokens, shell):

| Area | Status |
|---|---|
| Cream tokens (bg/shell/raised/ink/accent/series) | Matched |
| IBM Plex Sans + mono stack | Matched (Plex Mono 400 installed; Cascadia as fallback) |
| Titlebar 48px, brand mark 28px, Chip + window controls | Matched |
| Sidebar 212px @ ~8/52, shell fill, active nav | Matched (active uses authorized mint→ice gradient) |
| Machine card at sidebar footer | Matched |
| Workspace status bar | Matched (live copy, not “Sample telemetry”) |
| Overview H1 “Control Center”, 4 stat cards, activity, glance, drives | Matched structurally |
| System activity ticks 100/75/50/25/0 | Matched |
| At a glance = Graphics / Firewall / Storage (live APIs) | Matched |
| Buttons radius 8 (not pills) | Matched |

## Authorized gradient enhancements (only)

1. **Active nav** — mint `#d5e5dc` → ice `#e8f1f4` fill (Figma baseline is solid accentSoft).
2. **Primary button** — teal `#176c5b` with slight blue `#366f9d` edge (Figma is solid teal).
3. **Storage reclaim strip** — warm gold → peach (prediction/reclaim feedback only).

These are intentional and must not excuse unrelated layout drift.

## Screenshot evidence (Overview)

| Artifact | Path |
|---|---|
| Figma reference | `docs/figma-refs/overview.png` |
| Live Tauri @ 1440×900 (real telemetry) | `docs/app-shots/overview-live.png` |
| Browser fixture (`?fixture=1`) | `docs/app-shots/overview-fixture-browser.png` |
| Overlay (50% blend) | `docs/app-shots/overview-overlay.png` |

Overview live vs Figma (sharp, resized 1440×900): expect non-trivial mean Δ because live hostnames, drive counts, CPU/RAM values, and wallpaper/compositor differ from the Figma sample machine. Structural cream shell, sidebar, titlebar, status bar, and panel composition match the reference; this is **not** a claim of 100% pixel identity.

## Remaining fidelity / verification gaps

1. **Per-screen pixel overlays** — Figma refs exist for all 15 screens. Live Tauri captures + overlays beyond Overview still need a pass (navigate each view, capture 1440×900, diff). Do not claim 100% pixel-perfect for the full set.
2. **icon-cpu.svg** — cream strokes; sits on teal well (intentional invert).
3. **icon-refresh.svg** — reused as a network nodes glyph; replace when a dedicated asset exists.
4. **Dense table screens** — cream theme + real data; re-measure columns after remaining captures.
5. **Control Center** — all 83 tools via catalog + search/group filter; scroll to verify every group.
6. **Window vibrancy** — cream glass CSS is primary; acrylic may differ by compositor.
7. **Crash fixed** — `getCurrentWindow()` during render threw outside/before IPC ready and blanked the UI; now guarded.

## Functionality checks

- `npm run build` (`tsc && vite build`) — pass
- Telemetry: shared 1.5s poll, overlap guard, pause freezes history append, 30/60s window
- Backend: existing Tauri commands reused (storage, processes, performance, apps, services, startup, GPU, firewall, scheduler, network, users, control catalog × 83)
- Destructive flows: ConfirmModal (no `window.confirm`)
- Charts: real samples only (no Math.random)

## Manual verification still recommended

- Elevate / UAC handoff
- Uninstall quiet/auto-advance on a disposable test app
- Firewall profile toggle (prefer a VM)
- Release/Renew IP (expect brief disconnect)
- Native Control Center launchers that open MMC / Settings
