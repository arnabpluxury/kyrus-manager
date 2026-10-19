/**
 * Deterministic visual fixture for screenshot comparisons.
 * Enabled only when `?fixture=1` is present. Never used as live telemetry in normal mode.
 */
import type { PerformanceSnapshot } from "../types";
import type { TelemetrySample } from "./telemetry";

export function fixtureEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("fixture") === "1";
}

export function fixturePerf(): PerformanceSnapshot {
  return {
    cpuUsage: 24,
    cpuCores: 8,
    frequencyMhz: 3600,
    memoryTotal: 32 * 1024 ** 3,
    memoryUsed: 15.4 * 1024 ** 3,
    memoryAvailable: 16.6 * 1024 ** 3,
    swapTotal: 8 * 1024 ** 3,
    swapUsed: 1.2 * 1024 ** 3,
    diskReadBytesPerSec: 12_000_000,
    diskWriteBytesPerSec: 4_000_000,
    networkRxBytesPerSec: 7_200_000,
    networkTxBytesPerSec: 640_000,
    processCount: 186,
    uptimeSeconds: 2 * 86400 + 4 * 3600 + 16 * 60,
    hostname: "KYRUS-DESKTOP",
    osName: "Windows 11 Pro",
    osVersion: "64-bit",
    cpuBrand: "Intel Core i7-9700K",
  };
}

export function fixtureHistory(seconds = 60): TelemetrySample[] {
  const now = Date.now();
  const step = 1500;
  const count = Math.floor((seconds * 1000) / step);
  const out: TelemetrySample[] = [];
  for (let i = 0; i < count; i++) {
    const t = now - (count - i) * step;
    const wave = Math.sin(i / 4) * 8;
    out.push({
      t,
      cpu: Math.max(4, Math.min(96, 24 + wave)),
      memory: Math.max(20, Math.min(90, 48 + wave * 0.4)),
      diskRead: 8_000_000 + i * 20_000,
      diskWrite: 3_000_000,
      netRx: 6_000_000 + ((i * 37) % 2_000_000),
      netTx: 640_000,
    });
  }
  return out;
}
