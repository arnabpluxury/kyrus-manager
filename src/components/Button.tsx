import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger";
};

export function Button({ variant = "default", className = "", type = "button", ...rest }: Props) {
  const tone = variant === "default" ? "" : ` ${variant}`;
  return <button type={type} className={`btn${tone}${className ? ` ${className}` : ""}`} {...rest} />;
}
