"use client";

import { useEffect, useState } from "react";
import type { AccountOverview } from "@/types/account";
import { AccountPageHeader, StatusBadge } from "@/components/account/AccountUi";
import { PanelAccessButton } from "@/components/account/PanelAccessButton";
import { getAccountOverview } from "@/services/accountService";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { formatLimit } from "@/lib/utils";

const emptyOverview: AccountOverview = {
  activeStoreCount: null,
  activeUserCount: null,
  adminEmail: null,
  currentStoreCount: null,
  currentUserCount: null,
  hasActiveLicense: false,
  latestInvoiceStatus: null,
  licenseStatus: "pending",
  openSupportCount: 0,
  planName: "-",
  storeLimit: null,
  storeUsage: "-",
  tenantName: null,
  usageLastSyncedAt: null,
  usageStatus: "unavailable",
  userLimit: null,
  userUsage: "-",
};

export default function AccountPage() {
  const [overview, setOverview] = useState<AccountOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAccountOverview()
      .then((nextOverview) => {
        setOverview(nextOverview);
        setError("");
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Hesap Özeti alınamadı.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const usageLabel = (current: number | null, limit: number | string | null, unit: string) => {
    if (!overview.hasActiveLicense || overview.licenseStatus === "pending") {
      return "Aktivasyon bekleniyor";
    }
    if (overview.usageStatus === "unavailable") {
      return "Ana sistem kullanım bilgisi alınamadı.";
    }
    const planSlug = overview.planName?.toLowerCase().includes("demo") ? "demo" : null;
    const limitLabel = formatLimit(limit, planSlug, unit === "mağaza" ? "store" : "user");
    if (current === null) {
      return `0 / ${limitLabel} ${unit}`;
    }
    return `${current} / ${limitLabel} ${unit}`;
  };

  if (loading) {
    return (
      <>
        <AccountPageHeader
          description="Lisans, mağaza, fatura ve destek durumunuzu tek bakışta izleyin."
          eyebrow="Müşteri Portalı"
          title="Hesap Özeti"
        />
        <div className="account-metric-grid" style={{ marginTop: "24px" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="account-metric-card skeleton-card" style={{ height: "140px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px" }}>
              <div style={{ width: "40%", height: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
              <div style={{ width: "70%", height: "28px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", marginTop: "16px" }} />
            </Card>
          ))}
        </div>
      </>
    );
  }


  return (
    <>
      <AccountPageHeader
        description="Lisans, mağaza, fatura ve destek durumunuzu tek bakışta izleyin."
        eyebrow="Müşteri Portalı"
        title="Hesap Özeti"
      />

      {!overview.hasActiveLicense && (
        <div className="account-alert-premium" style={{
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.03) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.15)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              fontSize: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.1)",
              color: "var(--color-danger)"
            }} aria-hidden="true">
              ⚠️
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 4px 0", color: "var(--color-text-strong)" }}>
                Aktif Lisans Bulunamadı
              </h2>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                Panel erişimini aktifleştirmek için lütfen lisans anahtarınızı girin veya destek ekibimizle iletişime geçin.
              </p>
            </div>
          </div>
          <Button href="/hesap/aktivasyon" size="sm">
            Lisans Aktive Et
          </Button>
        </div>
      )}

      <div className="account-actions">
        <PanelAccessButton disabled={!overview.hasActiveLicense} />
        {!overview.hasActiveLicense ? <span className="account-action-note">Panel erişimi için aktif lisans gerekir.</span> : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {!overview.hasActiveLicense || overview.licenseStatus === "pending" ? (
        <p className="form-alert form-alert--info" role="status">
          Kullanım bilgileri aktivasyon tamamlandıktan sonra görüntülenir.
        </p>
      ) : overview.usageStatus === "unavailable" ? (
        <p className="form-alert form-alert--warning" role="status">
          Kullanım bilgileri şu anda güncellenemedi. Daha sonra tekrar kontrol edebilirsiniz.
        </p>
      ) : null}
      
      <div className="account-metric-grid">
        <MetricCard
          label="Aktif plan"
          value={overview.planName === "-" ? "Aktif plan yok" : overview.planName}
          icon="shield"
          iconColor="var(--color-primary)"
        />
        <MetricCard
          label="Lisans durumu"
          value={<StatusBadge status={overview.licenseStatus} type="license" />}
          icon="license"
          iconColor={overview.licenseStatus === "active" ? "var(--color-success)" : "var(--color-danger)"}
        />
        <MetricCard
          label="Mağaza kullanımı"
          value={usageLabel(overview.currentStoreCount, overview.storeLimit, "mağaza")}
          icon="store"
          iconColor="var(--color-accent)"
        />
        <MetricCard
          label="Kullanıcı kullanımı"
          value={usageLabel(overview.currentUserCount, overview.userLimit, "kullanıcı")}
          icon="user"
          iconColor="#8b5cf6"
        />
        <MetricCard
          label="Son fatura durumu"
          value={
            overview.latestInvoiceStatus ? (
              <StatusBadge status={overview.latestInvoiceStatus} type="invoice" />
            ) : (
              "Henüz fatura bulunmuyor"
            )
          }
          icon="billing"
          iconColor="#ec4899"
        />
        <MetricCard
          label="Açık destek talebi"
          value={String(overview.openSupportCount)}
          icon="headset"
          iconColor="#f59e0b"
        />
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: React.ReactNode;
  icon: IconName;
  iconColor: string;
}) {
  return (
    <Card className="account-metric-card premium-metric" padding="md">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <div className="metric-icon-wrapper" style={{ color: iconColor, backgroundColor: `${iconColor}15` }}>
          <Icon name={icon} />
        </div>
      </div>
      <div className="metric-body">
        {typeof value === "string" ? (
          <strong className="metric-value">{value}</strong>
        ) : (
          <div className="metric-badge-wrapper">{value}</div>
        )}
      </div>
    </Card>
  );
}


