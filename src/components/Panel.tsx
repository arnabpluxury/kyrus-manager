import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
  title,
  subtitle,
  extra,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  extra?: ReactNode;
}) {
  return (
    <section className={`panel panel-inner${className ? ` ${className}` : ""}`}>
      {title ? (
        <div className="panel-head">
          <div>
            <h2 className="panel-title">{title}</h2>
            {subtitle ? <p className="panel-sub">{subtitle}</p> : null}
          </div>
          {extra}
        </div>
      ) : null}
      {children}
    </section>
  );
}
