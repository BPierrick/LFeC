import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export function TextInput({ id, label, className = "team-input", ...rest }: Props) {
  return (
    <>
      <label htmlFor={id} className="visually-hidden">{label}</label>
      <input id={id} className={className} {...rest} />
    </>
  );
}
