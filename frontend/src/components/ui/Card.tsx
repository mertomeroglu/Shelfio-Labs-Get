import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "tinted" | "dark";
type CardPadding = "sm" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  padding?: CardPadding;
  variant?: CardVariant;
};

export function Card({
  children,
  className,
  elevated = false,
  interactive = false,
  padding = "md",
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={cx(
        "card",
        `card--${variant}`,
        `card--padding-${padding}`,
        elevated && "card--elevated",
        interactive && "card--interactive",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
