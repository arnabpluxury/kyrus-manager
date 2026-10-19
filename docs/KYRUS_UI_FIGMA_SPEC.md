# Kyrus Manager — Complete UI Spec for Figma Redesign

> **How to use this with ChatGPT / Figma**  
> Paste one **Screen** section at a time (or the whole file) and ask:  
> *“Design this exact screen in Figma. Keep all listed components, labels, data fields, actions, and states. Improve visual hierarchy, spacing, and polish. Do not remove functionality. Desktop Windows app, ~1440×900, dark frosted-glass system utility.”*

---

## 0. Product summary

| Field | Value |
|--------|--------|
| **App name** | Kyrus Manager |
| **Platform** | Native Windows desktop (Tauri 2 + React + Rust) |
| **Role** | System control center: storage, Task Manager replacement, apps/uninstall, GPU, firewall, scheduler, network, Control Panel launcher |
| **Default window** | 1440 × 900, min 1100 × 700, frameless (custom titlebar), transparent + Mica/Acrylic |
| **Theme** | Dark only today |
| **Audience** | Power users / admins |
| **Elevation** | Shows admin status; Elevate button when not elevated; release auto-elevates |

---

## 1. Design system (current tokens — redesign may evolve, but map 1:1)

### 1.1 Color tokens

| Token | Hex / value | Usage |
|--------|-------------|--------|
| `--bg-0` | `#0c1016` | Deep base |
| `--bg-1` | `#121820` | Secondary surface |
| `--ink` | `#e8eef6` | Primary text |
| `--ink-dim` | `#93a0b4` | Secondary text |
| `--ink-mute` | `#66758a` | Labels / captions |
| `--line` | `rgba(255,255,255,0.08)` | Hairline borders |
| `--line-strong` | `rgba(255,255,255,0.14)` | Stronger borders |
| `--glass` | `rgba(18,24,32,0.55)` | Glass panels |
| `--accent` | `#3dcea7` | Primary teal |
| `--accent-2` | `#5eb8ff` | Secondary blue |
| `--warn` | `#e8b45a` | Warning |
| `--danger` | `#e57373` | Destructive |
| `--ok` | `#3dcea7` | Success / admin OK |

**Background atmosphere:** dual radial glows (teal top-left, blue top-right) over dark graphite gradient. Transparent window so Mica shows through.

### 1.2 Typography

| Role | Font | Notes |
|------|------|--------|
| UI | Segoe UI Variable / Segoe UI | Body, nav, buttons |
| Mono | Cascadia Mono / Consolas | Paths, PIDs, sizes, rates |
| H1 (view) | ~28px, weight 600, tracking −0.03em | Screen title |
| H1 (section) | ~18px | Nested section titles |
| Label | 11px, uppercase, letter-spacing 0.08–0.16em | Stat card labels, nav groups |
| Body / table | 13px | Tables |
| Caption | 12px dim | Subtitles |

### 1.3 Radii & motion

| Token | Value |
|--------|--------|
| `--radius` | 18px (panels) |
| `--radius-sm` | 12px (cards, nav items) |
| Pills / buttons | `999px` (fully rounded) |
| `--ease` | `cubic-bezier(0.32, 0.72, 0, 1)` |
| Toast | rise fade ~420ms |
| Button press | scale 0.98 |

### 1.4 Layout grid (app shell)

```
┌─────────────────────────────────────────────────────────┐
│ TITLEBAR  height 48px                                   │
├────────────┬────────────────────────────────────────────┤
│ SIDEBAR    │ CONTENT                                    │
│ width 220  │ padding 22×24×28                           │
│ (190 @     │ scrollable                                 │
│  ≤1200px)  │                                            │
└────────────┴────────────────────────────────────────────┘
```

---

## 2. Shared UI components (global — design each as Figma components)

### 2.1 `Titlebar`
- **Left:** brand mark (18×18 rounded square, teal→blue gradient) + text **“Kyrus Manager”**
- **Right (meta):**
  - Pill: **Administrator** (ok) | **Not elevated** (warn)
  - Pill: live **CPU X% · RAM Y%**
  - Button **Elevate** (only if not elevated)
  - Window controls: Minimize `─`, Maximize `□`, Close `×` (close hover = red)
- Entire bar is drag region except interactive controls
- Glass blur backdrop

### 2.2 `Sidebar` / `NavGroup` / `NavItem`
- Groups with uppercase micro-label
- Items: small status dot + label
- States: default, hover, **active** (teal→blue soft fill + inset ring + accent dot glow)
- **Nav inventory (exact order):**

| Group | Items (labels) |
|--------|----------------|
| Home | Overview |
| Storage | Storage, Disk Treemap, Temp & Junk, Applications |
| Task Manager | Processes, Performance, GPU, Services, Startup, Users |
| System | Task Scheduler, Firewall, Network, Control Center |

### 2.3 `ViewHead`
- Left: H1 title + 1-line subtitle
- Right: `Toolbar` (filters, buttons)

### 2.4 `Toolbar`
- Horizontal wrap of fields + buttons, gap 8px

### 2.5 `Button` variants
| Variant | Class | Use |
|----------|--------|-----|
| Default | `.btn` | Secondary actions |
| Primary | `.btn.primary` | Main CTA (teal fill, dark text) |
| Danger | `.btn.danger` | Delete / kill / stop |
| Disabled | opacity 0.45 | When nothing selected / loading |

### 2.6 `Field` (pill input group)
- Rounded container with label text + `<input>` or `<select>`
- Used for Drive, Sort, Search, Min MB, Category, checkboxes with text

### 2.7 `StatCard`
- Label (uppercase micro)
- Value (large number/text)
- Optional sub line
- Optional `Meter` bar
- Optional `Spark` mini chart
- Can be clickable (Overview drives)

### 2.8 `Meter`
- 6px track; fill teal→blue
- Modifiers: `.warn` (≥75%), `.danger` (≥90%)

### 2.9 `Spark`
- 36 vertical bars sparkline for CPU/Memory history

### 2.10 `Panel` / `PanelInner`
- Glass card: blur, hairline border, inset highlight, soft shadow
- Inner padding 18px

### 2.11 `DataTable`
- Sticky header, uppercase column labels
- Rows: hover highlight; `.selected` teal tint
- Checkbox column often first
- Mono cells for numbers/paths
- `.path` ellipsis max ~360px
- Empty state: centered “No … yet”

### 2.12 `Chip`
- Small pill tag
- Variants: default, `.safe` (green), `.caution` (warn)

### 2.13 `AppRow` / `AppIcon`
- 28×28 icon (or letter fallback) + name + secondary path line

### 2.14 `Toast`
- Fixed bottom-right, glass, auto-dismiss ~4.2s
- Shows action results / errors

### 2.15 `PredictionPanel`
- Side panel titled “Space after action” / “After uninstall”
- Large teal free-space number
- Subtitle with reclaim amount + drive
- Optional item list table

### 2.16 `ConfirmDialog`
- Native `window.confirm` today — **Figma should design a custom modal** for: delete files, uninstall apps, end processes, disable startup, etc.

### 2.17 `EmptyState`
- Centered muted text inside panel/table

### 2.18 `TreemapCanvas`
- SVG 1000×560 viewBox, colored rounded rectangles, name + size labels when large enough
- Double-click drills into folder

---

## 3. Screens (every view)

---

### SCREEN 01 — Overview (`overview`)
**File:** `src/views/Overview.tsx`  
**Purpose:** Home dashboard / control-center summary

#### Layout
1. `ViewHead`
   - Title: **Control Center**
   - Subtitle: `{hostname} · {osName} {osVersion} · {cpuBrand}` or “Loading system telemetry…”
   - Actions: **Analyze storage** (primary → Storage), **Open processes** (→ Processes)
2. **Stat grid** (4 columns → 2 on narrow)
   - CPU: % + “N logical processors” + meter
   - Memory: % + “used / total” + meter
   - Processes: count + “Uptime Xd Xh Xm”
   - Network: RX rate value + “↓ in · ↑ TX/s”
3. **Panel: Connected drives**
   - Section title + “Live capacity…”
   - **Refresh** button
   - Drive cards (clickable → Storage): `driveType · fileSystem`, volume name, “X free of Y”, usage meter
   - Empty: “No drives detected yet.”

#### Data bindings
- `PerformanceSnapshot`, `DriveInfo[]`

#### States
- Loading telemetry; empty drives; meter warn/danger by %

---

### SCREEN 02 — Storage (`storage`)
**File:** `src/views/Storage.tsx`  
**Purpose:** Browse disk usage, filter/sort, delete, predict free space

#### Layout
1. `ViewHead`: **Storage** + subtitle about sort/filter/predict
2. Toolbar filters:
   - **Drive** select
   - **Sort** select: Size | Name | Modified | Category
   - **Min MB** number input
   - **Category** select: All + dynamic categories
   - **Rescan** (primary; shows “Scanning…”)
3. **Split layout** (1.4fr | 0.9fr)
   - **Left panel**
     - Toolbar: **Up**, breadcrumb path (mono), **Predict space**, **Delete selected** (danger)
     - Table columns: ☐ | Name | Category | Size | Type
     - Folder names accent-colored; click/double-click opens folder
     - Footer: “N files · M folders · scanned X in Y ms · truncated?”
   - **Right panel: Space after action**
     - Empty: select items to predict…
     - Filled: big free-after bytes, reclaim line, percent used after, item list (Item | Size)

#### Interactions
- Multi-select checkboxes
- Confirm before delete
- Toast with freed bytes / failures

#### Data
- `StorageEntry`, `StorageScanResult`, `SpacePrediction`, `DriveInfo`

---

### SCREEN 03 — Disk Treemap (`treemap`)
**File:** `src/views/Treemap.tsx`  
**Purpose:** Visual hierarchical disk map

#### Layout
1. `ViewHead`: **Disk Treemap** + “largest folders dominate…”
2. Toolbar: **Drive** select, **Up**, **Refresh** / “Mapping…”
3. Panel:
   - Path + total size line
   - Full-width SVG treemap blocks (color cycle), label = name + size
   - Double-click folder → drill in
   - Empty: “No treemap data yet.”

#### Data
- `TreemapNode` tree

---

### SCREEN 04 — Temp & Junk (`cleanup`)
**File:** `src/views/Cleanup.tsx`  
**Purpose:** Find and delete temp/cache/junk

#### Layout
1. `ViewHead`: **Temp & Junk**
2. Toolbar:
   - Checkbox **Safe targets only** (default on)
   - **Rescan** / Scanning…
   - **Predict**
   - **Delete selected** (danger)
3. Stat cards: Candidates | Selected | Selected size | After cleanup
4. Table: ☐ | Name (+ path subline) | Category | Age | Size | Safety chip (Safe / Review)

#### Categories shown (backend)
- User Temp, User TMP, Windows Temp, Windows Update Cache, Prefetch, LocalAppData Temp, Browser Cache, Crash Dumps, Profile Temp, Downloads (large)

#### Data
- `TempCandidate`, `SpacePrediction`

---

### SCREEN 05 — Applications (`apps`)
**File:** `src/views/Apps.tsx`  
**Purpose:** Installed apps inventory + multi-uninstall + space predict

#### Layout
1. `ViewHead`: **Applications**
2. Toolbar:
   - Search (Name / publisher)
   - Checkbox **Prefer quiet**
   - Checkbox **Auto Next/Yes** (uninstaller automation)
   - **Refresh**
   - **Predict space**
   - **Uninstall selected** (danger)
3. Split:
   - Table: ☐ | Application (icon+name+location) | Publisher | Version | Size | Arch chip
   - Prediction panel: **After uninstall** free space / reclaim

#### Data
- `InstalledApp` (id, name, publisher, version, installDate, installLocation, uninstall strings, estimatedSizeBytes, iconBase64, source, architecture)

---

### SCREEN 06 — Processes (`processes`)
**File:** `src/views/Processes.tsx`  
**Purpose:** Live process manager (Task Manager Processes+)

#### Layout
1. `ViewHead`: **Processes**
2. Toolbar: Search (Name or PID), Sort (CPU | Memory | Name), **End task** (danger)
3. Live table (refresh 1.5s), max ~400 rows:
   - ☐ | Name | PID | CPU | Memory | Disk R/W | Status | Path | Priority
4. Priority dropdown per row: Low | Below | Normal | Above | High

#### Interactions
- Multi-select end task + confirm
- Toast on priority change / errors

#### Data
- `ProcessInfo`

---

### SCREEN 07 — Performance (`performance`)
**File:** `src/views/Performance.tsx`  
**Purpose:** Live performance monitors

#### Layout
1. `ViewHead`: **Performance** + CPU brand / cores / MHz
2. Stat cards with sparklines:
   - CPU % + spark
   - Memory % + used/total/avail + spark
   - Disk I/O read rate + write sub
   - Network ↓ rate + ↑ sub
3. Secondary panel cards: Commit/Swap | Processes | Uptime | Host (+ OS)

#### Empty
- “Collecting performance samples…”

#### Data
- `PerformanceSnapshot` + local history arrays

---

### SCREEN 08 — GPU (`gpu`)
**File:** `src/views/Gpu.tsx`  
**Purpose:** GPU inventory + NVIDIA live telemetry

#### Layout
1. `ViewHead`: **GPU**
2. Toolbar: **Refresh**, **NVIDIA Control Panel** (primary), **DXDiag**
3. Grid of adapter cards: vendor label, name, driver, VRAM, status
4. If nvidia-smi available — panel **NVIDIA live**:
   - Per GPU: util %, mem %, VRAM used/total, temp, power draw/limit, fan %, clock, util meter
5. If not: empty note “nvidia-smi not available…”

#### Data
- `GpuInfo`, `NvidiaGpu`

---

### SCREEN 09 — Services (`services`)
**File:** `src/views/Services.tsx`  
**Purpose:** Windows services list + start/stop

#### Layout
1. `ViewHead`: **Services**
2. Toolbar: Search, **Refresh**
3. Table: Display name | Service | Status chip | Actions (**Start**, **Stop** danger)

#### Data
- `ServiceInfo`

---

### SCREEN 10 — Startup (`startup`)
**File:** `src/views/Startup.tsx`  
**Purpose:** Registry Run / RunOnce startup entries

#### Layout
1. `ViewHead`: **Startup**
2. **Refresh**
3. Table: Name | Location chip | Command | **Disable** (danger)

#### Data
- `StartupItem` (HKLM Run, HKCU Run, HKLM Run x86, HKCU RunOnce)

---

### SCREEN 11 — Users (`users`)
**File:** `src/views/Users.tsx`  
**Purpose:** Sessions + local accounts

#### Layout
1. `ViewHead`: **Users & Sessions**
2. Toolbar: **Refresh**, **Accounts settings**
3. Split:
   - **Sessions** table: User | Session | ID | State chip | Idle | Logon
   - **Local users** table: Account
4. Empty sessions: “No sessions reported…”

#### Data
- `UserSession`, `string[]` local users

---

### SCREEN 12 — Task Scheduler (`scheduler`)
**File:** `src/views/Scheduler.tsx`  
**Purpose:** Scheduled tasks control

#### Layout
1. `ViewHead`: **Task Scheduler**
2. Toolbar: Search, **Refresh**, **Open console**
3. Table: Task (name + task-to-run path) | Status chip | Next | Last result | Actions
4. Per-row actions: **Run**, **End**, **Enable**, **Disable** (danger)

#### Data
- `ScheduledTask`

---

### SCREEN 13 — Firewall (`firewall`)
**File:** `src/views/Firewall.tsx`  
**Purpose:** Profiles + rules

#### Layout
1. `ViewHead`: **Firewall**
2. Toolbar: **Refresh**, **Advanced Firewall**
3. Profile cards: name, state, inbound/outbound policy, **On** / **Off** buttons
4. Panel: Search rules + table Name | Enabled | Direction | Profiles | Action chip

#### Data
- `FirewallProfile`, `FirewallRule`

---

### SCREEN 14 — Network (`network`)
**File:** `src/views/Network.tsx`  
**Purpose:** Adapters + ipconfig + network actions

#### Layout
1. `ViewHead`: **Network**
2. Toolbar: **Refresh**, **Flush DNS**, **Release / Renew** (danger), **Connections**
3. Adapter cards: name, ↓/↑ totals, packets, errors
4. Panel table: Section | Details (preformatted ipconfig blocks)

#### Data
- `NetworkAdapter`, ipconfig entries

---

### SCREEN 15 — Control Center (`control`)
**File:** `src/views/Control.tsx` + catalog in `src-tauri/src/control.rs`  
**Purpose:** Launch Windows Settings / CPL / MSC / tools

#### Layout
1. `ViewHead`: **Control Center**
2. Grouped sections (nav-label + card grid)
3. Each card: group label, title, description — click runs action + toast

#### Exact groups & tiles (design all)

**Settings**
- System, Display, Sound, Notifications, Focus assist, Power & battery, Storage, Installed apps, Default apps, Network & internet, Wi-Fi, Ethernet, VPN, Bluetooth, Bluetooth & devices, Printers & scanners, Accounts, Sign-in options, Windows Update, Activation, Privacy & security, Windows Security, About PC, Date & time, Language & region, Accessibility, Gaming, Personalization, Themes, Colors, Taskbar, Startup apps, Optional features, Recovery, Troubleshoot

**Hardware**
- Device Manager, Disk Management, Computer Management, Optimize Drives, Print Management, Developer settings

**Security**
- Windows Defender Firewall, Advanced Firewall, Local Security Policy, Group Policy Editor, Certificates, Credential Manager

**Diagnostics**
- Resource Monitor, Performance Monitor, Event Viewer, Services, Task Scheduler, System Configuration, System Information, DirectX Diagnostic, Reliability Monitor, System Properties, Windows Version

**Network**
- Network Connections, Internet Options, Flush DNS, Release / Renew IP, Open netstat view

**Storage**
- Disk Cleanup, Empty Recycle Bin, Storage settings

**Power**
- Power Options, Sleep settings

**Legacy**
- Control Panel, God Mode, Programs and Features, Date and Time, Sound (classic), Display (classic), Mouse, Region, User Accounts, Add Hardware, System (classic), Windows Features

**GPU**
- NVIDIA Control Panel, NVIDIA App / GeForce, DXDiag Display

#### Data
- `ControlAction` { id, title, description, group }

---

## 4. Overlay / chrome components (all screens)

| Component | Behavior |
|-----------|----------|
| Toast | Success/error messages from any action |
| Confirm modal (to design) | Destructive confirms |
| Loading labels | “Scanning…”, “Mapping…”, “Loading…”, “Collecting…” |
| Disabled controls | When selection empty or busy |
| Admin pill + Elevate | Global titlebar |

---

## 5. Information architecture (sitemap)

```
Kyrus Manager
├── Home
│   └── Overview
├── Storage
│   ├── Storage (list / predict / delete)
│   ├── Disk Treemap
│   ├── Temp & Junk
│   └── Applications
├── Task Manager
│   ├── Processes
│   ├── Performance
│   ├── GPU
│   ├── Services
│   ├── Startup
│   └── Users
└── System
    ├── Task Scheduler
    ├── Firewall
    ├── Network
    └── Control Center (tile launcher)
```

---

## 6. Component inventory checklist (for Figma library)

Create these as **components** with variants:

- [ ] AppShell (Titlebar + Sidebar + Content)
- [ ] BrandMark
- [ ] StatusPill (ok / warn / neutral)
- [ ] WindowControls
- [ ] NavGroup / NavItem (default / hover / active)
- [ ] ViewHead
- [ ] Button (default / primary / danger / disabled)
- [ ] Field (input / select / checkbox+label)
- [ ] StatCard (+ optional Meter / Spark)
- [ ] Meter (normal / warn / danger)
- [ ] Sparkline
- [ ] Panel
- [ ] DataTable / TableHeader / TableRow (default / hover / selected)
- [ ] Checkbox
- [ ] Chip (default / safe / caution)
- [ ] AppIcon / AppRow
- [ ] PredictionPanel (empty / filled)
- [ ] TreemapBlock
- [ ] Toast
- [ ] ModalConfirm (new)
- [ ] EmptyState
- [ ] ControlTile (Control Center card)
- [ ] DriveCard
- [ ] GpuCard / NvidiaLiveCard
- [ ] FirewallProfileCard
- [ ] NetworkAdapterCard
- [ ] PrioritySelect
- [ ] PathBreadcrumb

---

## 7. Suggested Figma page structure

1. **00 Cover** — Kyrus Manager UI Kit
2. **01 Foundations** — color, type, radii, elevation/glass
3. **02 Components** — library above
4. **03 Shell** — titlebar + sidebar states
5. **04–18 Screens** — one artboard per screen at 1440×900
6. **19 Flows** — Storage delete+predict, Apps uninstall, Processes end task, Elevate
7. **20 Mobile/compact notes** — optional; app is desktop-first (sidebar collapses width at 1200)

---

## 8. ChatGPT prompt template (copy-paste)

```
You are a product designer creating Figma screens for "Kyrus Manager",
a Windows system utility (Task Manager + Storage + Control Panel hybrid).

Constraints:
- Desktop 1440×900, dark frosted-glass aesthetic (NOT purple AI slop, NOT cream editorial)
- Keep EVERY control, column, label, and action listed below
- Improve hierarchy, spacing, and polish only
- Use the component names from the inventory
- Deliver: layout description + component list + states for this screen

SCREEN:
[paste one SCREEN section from KYRUS_UI_FIGMA_SPEC.md]
```

---

## 9. Backend/API map (for designers — what data appears in UI)

| UI need | API |
|---------|-----|
| Admin pill / Elevate | `get_admin_status`, `relaunch_admin` |
| Live CPU/RAM pill + Performance | `get_performance` |
| Drives | `list_drives` |
| Storage scan/delete/predict | `scan_storage`, `delete_paths`, `predict_space` |
| Treemap | `build_treemap` |
| Temp cleanup | `discover_temp` |
| Processes | `list_processes`, `kill_process`, `set_process_priority` |
| Apps | `list_apps`, `uninstall_apps` |
| Services | `list_services`, `control_service` |
| Startup | `list_startup`, `disable_startup` |
| GPU | `list_gpus`, `nvidia_snapshot` |
| Firewall | `firewall_profiles`, `firewall_rules`, `firewall_set_state` |
| Scheduler | `list_scheduled_tasks`, `run/end/set_scheduled_task` |
| Network | `list_network_adapters`, `ipconfig_all`, control flush/renew |
| Users | `list_user_sessions`, `list_local_users` |
| Control tiles | `control_catalog`, `run_control_action` |

---

## 10. Non-goals for redesign (do not drop)

- Multi-select delete / uninstall / end-task
- Space prediction side panels
- Live refreshing process/performance/GPU meters
- Admin elevation affordance
- Full Control Center tile set
- Treemap drill-down
- Uninstaller quiet + auto-advance toggles

---

*Generated from the Kyrus Manager codebase (`src/App.tsx`, `src/views/*`, `src/App.css`, `src/lib/api.ts`, `src-tauri/src/control.rs`). Keep this file as the source of truth when redesigning in Figma.*
