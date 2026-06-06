"use client";

import { useEffect, useState } from "react";
import type { AdminLicense } from "@/services/adminService";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getAdminLicenses, renewAdminLicense, revokeAdminLicense } from "@/services/adminService";
import { Button } from "@/components/ui/Button";

const statusLabels = {
  active: "Aktif",
  expired: "Süresi doldu",
  pending: "Aktivasyon bekliyor",
  revoked: "İptal",
} as const;



function getLicenseTypeLabel(license: AdminLicense) {
  if (license.parentLicenseId) return "Ek Mağaza Lisansı";
  if (license.licenseType === "demo") return "Demo Lisansı";
  if (license.licenseType === "enterprise") return "Kurumsal / Özel";
  return "Standart Lisans";
}

function getLicenseStructureLabel(license: AdminLicense) {
  if (license.licenseStructure === "additional_store" || license.parentLicenseId) {
    return "Ek Mağaza Lisansı";
  }
  return "Ana Lisans";
}

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<AdminLicense[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<AdminLicense | null>(null);
  const [renewedLicense, setRenewedLicense] = useState<AdminLicense | null>(null);
  const [error, setError] = useState("");

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    isAlert?: boolean;
  }>({ isOpen: false, title: "", message: "" });

  function showConfirm(title: string, message: string, onConfirm: () => void) {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText: "Devam Et",
      cancelText: "İptal",
      isAlert: false,
    });
  }

  function showAlert(title: string, message: string) {
    setModalConfig({
      isOpen: true,
      title,
      message,
      confirmText: "Tamam",
      isAlert: true,
    });
  }

  useEffect(() => {
    void getAdminLicenses()
      .then((nextLicenses) => {
        setLicenses(nextLicenses);
        setError("");
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Lisans listesi alınamadı.");
      });
  }, []);

  return (
    <>
      <AdminPageHeader
        description="Lisans kayıtlarını plan, müşteri, durum ve kullanım süresiyle takip edin."
        title="Lisanslar"
      />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="admin-data-table-wrap">
        <table className="admin-data-table admin-data-table--licenses">
          <colgroup>
            <col className="admin-license-col--structure" />
            <col className="admin-license-col--key" />
            <col className="admin-license-col--customer" />
            <col className="admin-license-col--email" />
            <col className="admin-license-col--plan" />
            <col className="admin-license-col--status" />
            <col className="admin-license-col--date" />
            <col className="admin-license-col--remaining" />
            <col className="admin-license-col--action" />
          </colgroup>
          <thead>
            <tr>
              <th>Lisans Yapısı</th>
              <th>Lisans</th>
              <th>Müşteri</th>
              <th>E-posta</th>
              <th>Plan</th>
              <th>Durum</th>
              <th>Bitiş</th>
              <th>Kalan</th>
              <th>Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => (
              <tr key={license.id}>
                <td>
                  <span className="admin-status-badge is-active" style={{ fontSize: "0.74rem", backgroundColor: (license.licenseStructure === "additional_store" || license.parentLicenseId) ? "rgba(37, 99, 235, 0.1)" : "rgba(34, 197, 94, 0.1)", color: (license.licenseStructure === "additional_store" || license.parentLicenseId) ? "var(--color-primary)" : "#15803d", borderColor: (license.licenseStructure === "additional_store" || license.parentLicenseId) ? "rgba(37, 99, 235, 0.2)" : "rgba(34, 197, 94, 0.2)" }}>
                    {getLicenseStructureLabel(license)}
                  </span>
                </td>
                <td><span className="admin-truncate admin-mono" title={license.maskedKey}>{license.maskedKey}</span></td>
                <td><strong className="admin-truncate" title={license.customerName}>{license.customerName}</strong></td>
                <td><span className="admin-truncate" title={license.customerEmail}>{license.customerEmail}</span></td>
                <td><span className="admin-truncate" title={license.planName}>{license.planName}</span></td>
                <td><LicenseStatusBadge status={license.status} /></td>
                <td>{license.expiresAt}</td>
                <td>{license.remainingDays === null ? "Süresiz" : `${license.remainingDays} gün`}</td>
                <td><button className="admin-detail-button" onClick={() => setSelectedLicense(license)} type="button">Detay</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!licenses.length ? <div className="admin-empty-state">Henüz lisans kaydı bulunmuyor.</div> : null}
      </div>
      {selectedLicense ? (
        <DetailDrawer onClose={() => setSelectedLicense(null)}>
          <Detail label="Lisans anahtarı" mono value={selectedLicense.maskedKey} />
          <Detail label="Müşteri" value={selectedLicense.customerName} />
          <Detail label="E-posta" value={selectedLicense.customerEmail} />
          <Detail label="Tenant" mono value={selectedLicense.tenantId ?? "Aktivasyon bekliyor"} />
          <Detail label="İşletme" value={selectedLicense.businessName} />
          <Detail label="Plan" value={selectedLicense.planName} />
          <Detail label="Lisans tipi" value={getLicenseTypeLabel(selectedLicense)} />
          {selectedLicense.parentLicenseId && (
            <>
              <Detail label="Bağlı Olduğu Ana Lisans" mono value={selectedLicense.parentMaskedKey || selectedLicense.parentLicenseId} />
              {selectedLicense.parentStoreName && (
                <Detail label="Ana Lisans Mağazası" value={selectedLicense.parentStoreName} />
              )}
            </>
          )}
          {selectedLicense.storeName && (
            <Detail label="Mağaza Adı" value={selectedLicense.storeName} />
          )}
          <div className="admin-drawer__detail">
            <span>Durum</span>
            <LicenseStatusBadge status={selectedLicense.status} />
          </div>
          <Detail label="Başlangıç tarihi" value={selectedLicense.activatedAt} />
          <Detail label="Bitiş tarihi" value={selectedLicense.expiresAt} />
          <Detail label="Kalan süre" value={selectedLicense.remainingDays === null ? "Süresiz" : `${selectedLicense.remainingDays} gün`} />
          <Detail label="Mağaza limiti" value={String(selectedLicense.storeLimit)} />
          <Detail label="Kullanıcı limiti" value={String(selectedLicense.userLimit)} />
          {renewedLicense?.id === selectedLicense.id ? (
            <div className="admin-license-success admin-license-success--drawer">
              <div>
                <span className="success-badge">Lisans Yenilendi</span>
                <h3>{renewedLicense.planName} lisansı yenilendi</h3>
                <p>
                  {renewedLicense.mailSent
                    ? "Yeni lisans anahtarı oluşturuldu. Müşteriye lisans yenileme bildirimi gönderildi."
                    : "Lisans yenilendi ancak e-posta bildirimi gönderilemedi."}
                </p>
              </div>
              <code>{renewedLicense.fullKey ?? renewedLicense.maskedKey}</code>
              <Button disabled={!renewedLicense.fullKey} onClick={() => renewedLicense.fullKey ? void navigator.clipboard.writeText(renewedLicense.fullKey) : undefined} size="sm" type="button">
                Yeni Anahtarı Kopyala
              </Button>
            </div>
          ) : null}
          <button
            className="admin-secondary-action-button"
            onClick={() => {
              showConfirm(
                "Lisans Yenileme",
                "Bu lisans için yeni anahtar üretilecek. Eski anahtar geçersiz olacaktır. Devam edilsin mi?",
                () => {
                  renewAdminLicense(selectedLicense.id)
                    .then((license) => {
                      setRenewedLicense(license);
                      setLicenses(prev => prev.map(l => l.id === selectedLicense.id ? { ...l, maskedKey: license.maskedKey } : l));
                      setSelectedLicense(prev => prev ? { ...prev, maskedKey: license.maskedKey } : null);
                    })
                    .catch((caught) => {
                      showAlert("Hata", caught instanceof Error ? caught.message : "Lisans anahtarı yenilenemedi.");
                    });
                }
              );
            }}
            type="button"
          >
            Anahtarı Yenile
          </button>
          {selectedLicense.status !== "revoked" ? (
            <button
              className="admin-revoke-button"
              onClick={() => {
                showConfirm(
                  "Lisansı İptal Et",
                  "Bu lisansı iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
                  () => {
                    revokeAdminLicense(selectedLicense.id)
                      .then(() => {
                        setLicenses(prev => prev.map(l => l.id === selectedLicense.id ? { ...l, status: "revoked" } : l));
                        setSelectedLicense(prev => prev ? { ...prev, status: "revoked" } : null);
                      })
                      .catch((caught) => {
                        showAlert("Hata", caught instanceof Error ? caught.message : "Lisans iptal edilemedi.");
                      });
                  }
                );
              }}
              type="button"
            >
              Lisansı İptal Et
            </button>
          ) : null}
          <p className="admin-drawer__note">Güvenlik nedeniyle lisans anahtarının tamamı liste ve detay ekranlarında gösterilmez.</p>
        </DetailDrawer>
      ) : null}

      {modalConfig.isOpen && (
        <div className="auth-modal" style={{ zIndex: 99999 }} role="dialog" aria-modal="true">
          <div className="auth-modal__backdrop" onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} />
          <div className="auth-modal__panel" style={{ maxWidth: "440px", width: "100%", padding: "24px" }}>
            <div className="auth-modal__header" style={{ marginBottom: "16px", borderBottom: "none", paddingBottom: 0 }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>{modalConfig.title}</h2>
              <button aria-label="Kapat" className="auth-modal__close" onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} type="button">×</button>
            </div>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-body)", marginBottom: "24px", lineHeight: "1.5" }}>
              {modalConfig.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              {!modalConfig.isAlert && (
                <Button variant="outline" onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}>
                  {modalConfig.cancelText || "İptal"}
                </Button>
              )}
              <Button onClick={() => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                if (modalConfig.onConfirm) modalConfig.onConfirm();
              }}>
                {modalConfig.confirmText || "Tamam"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LicenseStatusBadge({ status }: { status: AdminLicense["status"] }) {
  const className = status === "active" ? "is-active" : status === "pending" ? "is-pending" : "is-inactive";
  return <span className={`admin-status-badge ${className}`}>{statusLabels[status]}</span>;
}

function Detail({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return <div className="admin-drawer__detail"><span>{label}</span><strong className={mono ? "admin-mono" : undefined}>{value}</strong></div>;
}

function DetailDrawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div aria-labelledby="license-drawer-title" aria-modal="true" className="admin-drawer" role="dialog">
      <button aria-label="Detay penceresini kapat" className="admin-drawer__backdrop" onClick={onClose} type="button" />
      <aside className="admin-drawer__panel">
        <div className="admin-drawer__header">
          <div><span>Lisans yönetimi</span><h2 id="license-drawer-title">Lisans Detayı</h2></div>
          <button aria-label="Kapat" className="admin-drawer__close" onClick={onClose} type="button">×</button>
        </div>
        <div className="admin-drawer__content">{children}</div>
      </aside>
    </div>
  );
}
