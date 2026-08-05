import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "end" | "next" | "stop" | "reset";
}

export function Button({ variant = "primary", className = "", ...rest }: Props) {
  const variantClass = variant === "primary" ? "admin-start-button" : `admin-button admin-button-${variant}`;
  return (
    <button type="button" className={`${variantClass} ${className}`} {...rest} />
  );
}
