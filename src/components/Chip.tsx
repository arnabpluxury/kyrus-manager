import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tone?: "neutral" | "safe" | "warn" | "caution" | "danger" | "default";
  className?: string;
};

export function Chip({ children, tone = "neutral", className = "" }: Props) {
  const resolved = tone === "default" ? "neutral" : tone === "caution" ? "warn" : tone;
  return (
    <span className={`chip ${resolved}${className ? ` ${className}` : ""}`}>
      <span className="chip-dot" aria-hidden />
      {children}
    </span>
  );
}
