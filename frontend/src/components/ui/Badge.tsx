import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "neutral" | "accent" | "dark";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  icon?: ReactNode;
  variant?: BadgeVariant;
};

export function Badge({ children, className, icon, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span className={cx("badge", `badge--${variant}`, className)} {...props}>
      {icon ? <span className="badge__icon">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
