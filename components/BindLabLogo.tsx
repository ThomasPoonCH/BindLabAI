import type { HTMLAttributes } from "react";

type BindLabLogoProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "dark" | "light";
  compact?: boolean;
};

export function BindLabLogo({ tone = "dark", compact = false, className = "", ...props }: BindLabLogoProps) {
  return (
    <div className={`inline-flex items-center ${className}`} {...props}>
      <img
        src="/assets/bindlab-logo.png"
        alt="BindLab logo"
        className={`${compact ? "h-9 w-9" : "h-11 w-11"} object-contain ${tone === "dark" ? "brightness-0" : ""}`}
      />
    </div>
  );
}
