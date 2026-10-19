import type { ReactNode } from "react";

export function Field({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      {children}
    </label>
  );
}
