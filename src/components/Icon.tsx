import brand from "../assets/kyrus-logo.png";
import winMinus from "../assets/figma/win-minus.svg";
import winMaximize from "../assets/figma/win-maximize.svg";
import winClose from "../assets/figma/win-close.svg";
import overview from "../assets/figma/nav-overview.svg";
import storage from "../assets/figma/nav-storage.svg";
import treemap from "../assets/figma/nav-treemap.svg";
import cleanup from "../assets/figma/nav-cleanup.svg";
import apps from "../assets/figma/nav-apps.svg";
import processes from "../assets/figma/nav-processes.svg";
import performance from "../assets/figma/nav-performance.svg";
import gpu from "../assets/figma/nav-gpu.svg";
import services from "../assets/figma/nav-services.svg";
import startup from "../assets/figma/nav-startup.svg";
import users from "../assets/figma/nav-users.svg";
import scheduler from "../assets/figma/nav-scheduler.svg";
import firewall from "../assets/figma/nav-firewall.svg";
import network from "../assets/figma/nav-network.svg";
import control from "../assets/figma/nav-control.svg";
import cpu from "../assets/figma/icon-cpu.svg";
import memory from "../assets/figma/icon-memory.svg";
import processesMark from "../assets/figma/icon-processes.svg";
import networkPulse from "../assets/figma/icon-network.svg";
import storageMark from "../assets/figma/icon-storage.svg";
import drive from "../assets/figma/icon-drive.svg";
import graphics from "../assets/figma/icon-graphics.svg";
import shield from "../assets/figma/icon-shield.svg";
import display from "../assets/figma/icon-display.svg";
import networkNodes from "../assets/figma/icon-refresh.svg";

const ICONS = {
  brand,
  winMinus,
  winMaximize,
  winClose,
  overview,
  storage,
  treemap,
  cleanup,
  apps,
  processes,
  performance,
  gpu,
  services,
  startup,
  users,
  scheduler,
  firewall,
  network,
  control,
  cpu,
  memory,
  processesMark,
  networkPulse,
  storageMark,
  drive,
  graphics,
  shield,
  display,
  networkNodes,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 18 }: { name: IconName; size?: 16 | 18 | 28 }) {
  return (
    <span className={`icon-wrap s-${size}`}>
      <img src={ICONS[name]} alt="" width={size} height={size} draggable={false} />
    </span>
  );
}
