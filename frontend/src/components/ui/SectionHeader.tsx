import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

type SectionHeaderProps = {
  action?: ReactNode;
  align?: "left" | "center";
  description?: string;
  eyebrow?: string;
  maxWidth?: "sm" | "md" | "lg";
  title: string;
};

export function SectionHeader({
  action,
  align = "left",
  description,
  eyebrow,
  maxWidth = "md",
  title,
}: SectionHeaderProps) {
  return (
    <div
      className={cx(
        "section-header",
        `section-header--${maxWidth}`,
        align === "center" && "section-header--center",
      )}
    >
      <div className="section-header__copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="section-header__action">{action}</div> : null}
    </div>
  );
}
