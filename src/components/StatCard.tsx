import type { ReactNode } from "react";
import { Meter } from "./Meter";
import { Spark } from "./Spark";

type Props = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  meter?: number;
  meterTone?: "auto" | "cpu" | "memory" | "disk" | "network";
  spark?: number[];
  sparkColor?: string;
  icon?: ReactNode;
  well?: "cpu" | "soft";
  onClick?: () => void;
  plain?: boolean;
};

export function StatCard({
  label,
  value,
  sub,
  meter,
  meterTone = "auto",
  spark,
  sparkColor,
  icon,
  well = "soft",
  onClick,
  plain = false,
}: Props) {
  const body = (
    <>
      <div className="stat-top">
        {icon ? <span className={`icon-well ${well}`}>{icon}</span> : null}
        <div className="label">{label}</div>
      </div>
      <div className="value-row">
        <div className="value">{value}</div>
        {spark && spark.length > 0 ? <Spark values={spark.slice(-36)} color={sparkColor} /> : null}
      </div>
      {sub != null && sub !== "" ? <div className="sub">{sub}</div> : null}
      {meter != null ? <Meter value={meter} tone={meterTone} /> : null}
    </>
  );
  const className = `stat-card${plain ? " raised" : " panel"}`;
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}
