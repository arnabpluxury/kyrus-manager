export function meterTone(pct: number): "ok" | "warn" | "danger" {
  if (pct >= 90) return "danger";
  if (pct >= 75) return "warn";
  return "ok";
}

export function Meter({
  value,
  tone = "auto",
  compact = false,
}: {
  value: number;
  tone?: "auto" | "cpu" | "memory" | "disk" | "network";
  compact?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const cls = tone === "auto" ? meterTone(pct) : tone;
  return (
    <div className={`meter ${cls}${compact ? " tight" : ""}`} aria-hidden>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}
