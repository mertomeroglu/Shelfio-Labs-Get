"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminStats } from "@/services/adminService";
import { AdminMetricCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Card } from "@/components/ui/Card";
import { getAdminStats } from "@/services/adminService";
import { Icon } from "@/components/ui/Icon";

const emptyStats: AdminStats = {
  demoRequests: 0,
  pendingActivations: 0,
  recentActions: [],
  supportTickets: 0,
  totalLicenses: 0,
};

const quickActions = [
  { description: "Yeni müşteri için lisans oluşturun.", href: "/admin/lisans-uret", label: "Lisans Üret", iconName: "plus" as const },
  { description: "Yeni demo başvurularını inceleyin.", href: "/admin/demo-talepleri", label: "Demo Talepleri", iconName: "users" as const },
  { description: "Müşteri hesaplarını ve planlarını görüntüleyin.", href: "/admin/musteriler", label: "Müşteriler", iconName: "user" as const },
];

type RecentActionView = {
  account: string;
  iconName: "headset" | "key" | "license" | "plus" | "shield" | "user";
  meta: string;
  status: "Aktif" | "Bilgi" | "Tamamlandı";
  summary: string;
};

function normalizePlanName(value: string) {
  const plan = value.trim();
  const lowerPlan = plan.toLocaleLowerCase("tr-TR");
  if (lowerPlan.includes("kurumsal") || lowerPlan.includes("enterprise")) return "Kurumsal";
  if (lowerPlan.includes("profesyonel") || lowerPlan.includes("professional")) return "Profesyonel";
  if (lowerPlan.includes("demo")) return "Demo";
  if (lowerPlan.includes("başlangıç") || lowerPlan.includes("baslangic") || lowerPlan.includes("starter")) return "Başlangıç";
  return plan || "Lisans";
}

function formatRecentAction(action: string): RecentActionView {
  const [rawOperation, rawAccount] = action.split(" - ");
  const operation = rawOperation?.trim() || action;
  const account = rawAccount?.trim() || "Müşteri hesabı";
  const planName = normalizePlanName(operation.replace(/lisans[ıi]?/i, "").trim());

  if (planName === "Demo") {
    return {
      account,
      iconName: "key",
      meta: "Demo akışı",
      status: "Tamamlandı",
      summary: `${account} hesabı için demo lisansı oluşturuldu`,
    };
  }

  return {
    account,
    iconName: planName === "Kurumsal" ? "shield" : "license",
    meta: "Lisans yönetimi",
    status: "Aktif",
    summary: `${account} için ${planName} lisans oluşturuldu`,
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [error, setError] = useState("");

  useEffect(() => {
    void getAdminStats()
      .then((nextStats) => {
        setStats(nextStats);
        setError("");
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Admin istatistikleri alınamadı.");
      });
  }, []);

  return (
    <>
      <AdminPageHeader
        description="Müşteri, lisans, demo ve destek operasyonlarını tek ekrandan takip edin."
        title="Operasyon Özeti"
      />
      <div className="account-metric-grid account-metric-grid--compact admin-dashboard-metrics">
        <AdminMetricCard label="Toplam lisans" value={String(stats.totalLicenses)} iconName="license" colorVariant="primary" />
        <AdminMetricCard label="Aktif lisans" value={String(stats.activeLicenses ?? 0)} iconName="shield" colorVariant="success" />
        <AdminMetricCard label="Bekleyen aktivasyon" value={String(stats.pendingActivations)} iconName="key" colorVariant="warning" />
        <AdminMetricCard label="Demo talepleri" value={String(stats.demoRequests)} iconName="users" colorVariant="cyan" />
        <AdminMetricCard label="Müşteriler" value={String(stats.customers ?? 0)} iconName="user" colorVariant="info" />
        <AdminMetricCard label="Destek kuyruğu" value={String(stats.supportTickets)} iconName="headset" colorVariant="danger" />
      </div>
      {error ? <p className="form-error">{error}</p> : null}

      <div className="admin-dashboard-grid">
        <Card className="admin-dashboard-card">
          <div className="admin-section-heading">
            <span>Hızlı erişim</span>
            <h2>Operasyon Kısayolları</h2>
          </div>
          <div className="admin-quick-actions">
            {quickActions.map((action) => (
              <Link className="admin-quick-action premium-quick-action" href={action.href} key={action.href} style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ background: "rgba(37, 99, 235, 0.08)", border: "1px solid rgba(37, 99, 235, 0.12)", borderRadius: "8px", padding: "6px", display: "inline-flex" }}>
                    <Icon name={action.iconName} style={{ color: "var(--color-primary)", width: "18px", height: "18px" }} />
                  </div>
                  <strong style={{ color: "var(--color-text-strong)", fontSize: "1rem", fontWeight: 700 }}>{action.label}</strong>
                </div>
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "10px", lineHeight: "1.5" }}>{action.description}</span>
                <div className="premium-quick-action__arrow" style={{ position: "absolute", bottom: "12px", right: "12px", opacity: 0.4, transition: "opacity 0.2s" }}>
                  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="16" style={{ color: "var(--color-primary)" }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="admin-dashboard-card admin-operation-note">
          <div className="admin-section-heading">
            <span>Operasyon</span>
            <h2>Kontrol Özeti</h2>
          </div>
          <p>Bekleyen aktivasyonları, yeni demo başvurularını ve destek kuyruğunu öncelik sırasına göre değerlendirin. Lisans anahtarlarını yalnızca doğrulanmış işlem akışlarında paylaşın.</p>
        </Card>
      </div>

      <Card className="admin-dashboard-card admin-recent-card">
        <div className="admin-section-heading">
          <span>Güncel hareketler</span>
          <h2>Son İşlemler</h2>
        </div>
        {stats.recentActions.length ? (
          <div className="admin-recent-list">
            {stats.recentActions.map((action, index) => {
              const item = formatRecentAction(action);
              return (
                <div className="admin-recent-list__item" key={`${action}-${index}`}>
                  <span className="admin-recent-list__icon">
                    <Icon name={item.iconName} style={{ width: "16px", height: "16px" }} />
                  </span>
                  <span className="admin-recent-list__content">
                    <strong>{item.summary}</strong>
                    <small>{item.meta} · {item.account}</small>
                  </span>
                  <span className="admin-recent-list__status">{item.status}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty-state-premium">
            <div className="admin-empty-state-premium__icon">
              <Icon name="dashboard" style={{ width: "20px", height: "20px" }} />
            </div>
            <h3>Son İşlem Bulunmuyor</h3>
            <p>Sistemde henüz kaydedilmiş bir operasyonel aktivite bulunmamaktadır.</p>
          </div>
        )}
      </Card>
    </>
  );
}
