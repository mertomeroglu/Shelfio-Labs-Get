import type { AccountLicenseStatus, InvoiceStatus, StoreStatus } from "@/types/account";
import { Badge } from "@/components/ui/Badge";

type Status = AccountLicenseStatus | InvoiceStatus | StoreStatus;

const statusLabels: Record<Status, string> = {
  active: "Aktif",
  pending: "Beklemede",
  expired: "Süresi Doldu",
  revoked: "İptal Edildi",
  paid: "Ödendi",
};

export function StatusBadge({ status, type }: { status: Status; type?: "license" | "invoice" }) {
  let label = statusLabels[status];
  let variant: "success" | "warning" | "danger" = status === "active" || status === "paid" ? "success" : status === "pending" ? "warning" : "danger";

  if (type === "license" && status === "pending") {
    label = "Lisans bulunamadı";
    variant = "danger";
  }

  return <Badge variant={variant}>{label}</Badge>;
}

export function AccountPageHeader({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
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

