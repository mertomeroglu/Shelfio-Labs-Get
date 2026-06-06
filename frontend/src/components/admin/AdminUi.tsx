import type { CSSProperties } from "react";
import { Card } from "@/components/ui/Card";

export function AdminPageHeader({
  description,
  eyebrow = "Admin Portal",
  title,
}: {
  description: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="account-page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

import { Icon, type IconName } from "@/components/ui/Icon";

export function AdminMetricCard({
  label,
  value,
  iconName,
  colorVariant = "primary",
}: {
  label: string;
  value: string;
  iconName?: IconName;
  colorVariant?: "primary" | "success" | "warning" | "danger" | "info" | "cyan";
}) {
  const variantStyles = {
    primary: { bg: "#f8fbff", border: "rgba(37, 99, 235, 0.16)", text: "#1e3a8a", icon: "#2563eb" },
    success: { bg: "#f0fdf4", border: "rgba(22, 163, 74, 0.16)", text: "#14532d", icon: "#16a34a" },
    warning: { bg: "#fffbeb", border: "rgba(217, 119, 6, 0.16)", text: "#78350f", icon: "#d97706" },
    danger: { bg: "#fef2f2", border: "rgba(220, 38, 38, 0.16)", text: "#7f1d1d", icon: "#dc2626" },
    info: { bg: "#eff6ff", border: "rgba(59, 130, 246, 0.16)", text: "#1e40af", icon: "#3b82f6" },
    cyan: { bg: "#ecfeff", border: "rgba(6, 182, 212, 0.16)", text: "#083344", icon: "#06b6d4" },
  };

  const style = variantStyles[colorVariant] || variantStyles.primary;

  return (
    <Card className="account-metric-card admin-kpi-card" padding="sm" style={{ border: `1px solid ${style.border}`, background: style.bg } satisfies CSSProperties}>
      <div className="admin-kpi-card__header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span style={{ color: style.text, fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</span>
        {iconName && (
          <div className="admin-kpi-card__icon-wrap" style={{ background: "rgba(255,255,255,0.85)", border: `1px solid ${style.border}`, borderRadius: "8px", padding: "5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={iconName} style={{ color: style.icon, width: "16px", height: "16px" }} />
          </div>
        )}
      </div>
      <strong style={{ color: style.text, fontSize: "1.65rem", fontWeight: 800, marginTop: "6px", display: "block" }}>{value}</strong>
    </Card>
  );
}

export function PlaceholderTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Record<string, string>>;
}) {
  const tableStyle = { "--admin-table-columns": columns.length } as CSSProperties & Record<"--admin-table-columns", number>;

  return (
    <Card className="admin-table-card">
      <div className="admin-table">
        <div className="admin-table__row admin-table__row--head" style={tableStyle}>
          {columns.map((column) => <span key={column}>{column}</span>)}
        </div>
        {rows.length === 0 ? (
          <div className="admin-table__empty">Henüz kayıt bulunmuyor.</div>
        ) : null}
        {rows.map((row, index) => (
          <div className="admin-table__row" key={`${row[columns[0]]}-${index}`} style={tableStyle}>
            {columns.map((column) => <span key={column}>{row[column]}</span>)}
          </div>
        ))}
      </div>
    </Card>
  );
}
