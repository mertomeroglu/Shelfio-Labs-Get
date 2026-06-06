"use client";

import { useEffect, useState } from "react";
import type { AccountLicense, DataExportRequest, StoreLicenseRequest } from "@/types/account";
import { AccountPageHeader, StatusBadge } from "@/components/account/AccountUi";
import { PanelAccessButton } from "@/components/account/PanelAccessButton";
import {
  cancelAccountPlanUpgrade,
  getAccountLicenses,
  cancelAccountLicense,
  requestAccountPlanUpgrade,
  getStoreLicenseRequests,
  getDataExportRequests,
  createDataExportRequest,
} from "@/services/accountService";
import { plans } from "@/config/plans";
import { routes } from "@/lib/routes";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatLimit } from "@/lib/utils";

export default function AccountLicensesPage() {
  const [licenses, setLicenses] = useState<AccountLicense[]>([]);
  const [requests, setRequests] = useState<StoreLicenseRequest[]>([]);
  const [dataExports, setDataExports] = useState<DataExportRequest[]>([]);
  const [exportLoadingId, setExportLoadingId] = useState("");
  const [exportMessage, setExportMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [cancellingLicenseId, setCancellingLicenseId] = useState<string | null>(null);
  const [cancelPassword, setCancelPassword] = useState("");
  const [cancelConfirmText, setCancelConfirmText] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedLicenseModules, setSelectedLicenseModules] = useState<{ planName: string; modules: string[] } | null>(null);
  const [upgradeLicense, setUpgradeLicense] = useState<AccountLicense | null>(null);
  const [upgradePlanSlug, setUpgradePlanSlug] = useState("");
  const [upgradePassword, setUpgradePassword] = useState("");
  const [upgradeError, setUpgradeError] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [timeTick, setTimeTick] = useState(() => Date.now());

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [nextLicenses, nextRequests, nextExports] = await Promise.all([
        getAccountLicenses(),
        getStoreLicenseRequests().catch(() => []),
        getDataExportRequests().catch(() => []),
      ]);
      setLicenses(nextLicenses);
      setRequests(nextRequests);
      setDataExports(nextExports);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Veriler alınırken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  // Active / Main License details
  const activeLicense = licenses.find((l) => l.status === "active") || licenses[0];
  const storeLimit = activeLicense ? (typeof activeLicense.storeLimit === "number" ? activeLicense.storeLimit : parseInt(String(activeLicense.storeLimit), 10)) : 1;

  // Used licenses and requests count
  const usedLicensesCount = licenses.filter((l) => l.status === "active" || l.status === "pending").length;
  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;
  const totalUsed = usedLicensesCount + pendingRequestsCount;

  const limitReached = activeLicense && storeLimit !== null && totalUsed >= storeLimit;

  function openUpgrade(license: AccountLicense) {
    const availablePlans = getAvailablePlanChanges(license.planSlug);
    setUpgradeLicense(license);
    setUpgradePlanSlug(availablePlans[0]?.backendSlug ?? "");
    setUpgradePassword("");
    setUpgradeError("");
  }

  async function submitUpgrade(event: React.FormEvent) {
    event.preventDefault();
    if (!upgradeLicense || !upgradePlanSlug) return;
    setUpgradeLoading(true);
    setUpgradeError("");
    try {
      await requestAccountPlanUpgrade({ password: upgradePassword, planSlug: upgradePlanSlug });
      await fetchData();
      setUpgradeLicense(null);
    } catch (caught) {
      setUpgradeError(caught instanceof Error ? caught.message : "Plan değişikliği oluşturulamadı.");
    } finally {
      setUpgradeLoading(false);
    }
  }

  async function cancelUpgrade(changeId: string) {
    await cancelAccountPlanUpgrade(changeId);
    await fetchData();
  }

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingLicenseId) return;
    setCancelError("");
    setCancelLoading(true);
    try {
      await cancelAccountLicense(cancellingLicenseId, {
        password: cancelPassword,
        confirmText: cancelConfirmText,
      });
      await fetchData();
      setCancellingLicenseId(null);
      setCancelPassword("");
      setCancelConfirmText("");
    } catch (caught) {
      setCancelError(caught instanceof Error ? caught.message : "Lisans iptal edilemedi.");
    } finally {
      setCancelLoading(false);
    }
  };

  async function handleDataExportRequest(license: AccountLicense) {
    setExportLoadingId(license.id);
    setExportMessage(null);
    try {
      await createDataExportRequest({
        licenseId: license.id,
        storeName: license.storeName || "Ana Mağaza",
      });
      const nextExports = await getDataExportRequests();
      setDataExports(nextExports);
      setExportMessage({ text: "Veri talebiniz alındı. Excel hazır olduğunda indirme linki e-posta ile gönderilecek.", type: "success" });
    } catch (caught) {
      setExportMessage({ text: caught instanceof Error ? caught.message : "Veri talebi oluşturulamadı.", type: "error" });
    } finally {
      setExportLoadingId("");
    }
  }

  function latestExportForLicense(licenseId: string) {
    return dataExports.find((item) => item.licenseId === licenseId) ?? null;
  }

  function hasOpenExport(licenseId: string) {
    const exportRequest = latestExportForLicense(licenseId);
    return exportRequest?.status === "pending" || exportRequest?.status === "processing";
  }

  if (loading) {
    return (
      <>
        <AccountPageHeader
          description="Lisans durumunuzu, kullanım limitlerinizi ve açık modülleri inceleyin."
          eyebrow="Lisanslarım"
          title="Lisans Yönetimi"
        />
        <div style={{ display: "grid", gap: "24px", marginTop: "24px" }}>
          {[1, 2].map((i) => (
            <Card key={i} className="skeleton-card" style={{ height: "200px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: "30%", height: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
                <div style={{ width: "80px", height: "24px", background: "rgba(255,255,255,0.05)", borderRadius: "12px" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "16px" }}>
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} style={{ height: "35px", background: "rgba(255,255,255,0.04)", borderRadius: "6px" }} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <AccountPageHeader
        description="Lisans durumunuzu, kullanım limitlerinizi ve açık modülleri inceleyin."
        eyebrow="Lisanslarım"
        title="Lisans Yönetimi"
      />

      {error ? <p className="form-alert form-alert--danger" style={{ marginBottom: "16px" }} role="alert">{error}</p> : null}
      {exportMessage ? (
        <p className={`form-alert ${exportMessage.type === "success" ? "form-alert--success" : "form-alert--danger"}`} style={{ marginBottom: "16px" }} role="status">
          {exportMessage.text}
        </p>
      ) : null}

      {licenses.map((license) => (
        <Card className="account-license-card" key={license.id}>
          <div className="account-card-heading">
            <div>
              <p className="eyebrow">{license.id}</p>
              <h2>{license.planName} Plan</h2>
              <code>{license.maskedKey}</code>
            </div>
            <StatusBadge status={license.status} />
          </div>
          <div className="account-detail-grid">
            {license.storeName && <Detail label="Bağlı Mağaza" value={license.storeName} />}
            <Detail label="Başlangıç tarihi" value={license.startsAt} />
            <Detail label="Lisans tipi" value={license.isDemo ? "Demo" : license.licenseType === "enterprise" ? "Kurumsal / Özel" : "Standart"} />
            <Detail label="Bitiş tarihi" value={license.expiresAt} />
            <Detail label="Kalan süre" value={remainingTimeLabel(license)} />

            {/* Demo plan alignment check: if demo, store limit = 1, user limit = 5 */}
            <Detail label="Mağaza Hakkı" value={formatLimit(license.storeLimit, license.planSlug, "store")} />
            <Detail label="Kullanıcı Hakkı" value={formatLimit(license.userLimit, license.planSlug, "user")} />

            <Detail label="Aktivasyon durumu" value={license.activationStatus} />
          </div>
          {license.pendingPlanChange ? (
            <div className="account-plan-change">
              <div>
                <span>Plan düzenlemesi bekliyor</span>
                <strong>{license.planName} → {license.pendingPlanChange.newPlanName}</strong>
                <p>Yürürlük tarihi: {license.pendingPlanChange.startsAt}</p>
              </div>
              <Button onClick={() => void cancelUpgrade(license.pendingPlanChange!.id)} size="sm" type="button" variant="outline">
                Plan Düzenlemesini İptal Et
              </Button>
            </div>
          ) : null}
          {(() => {
            const modulesList = license.screenAccess && license.screenAccess.length > 0 ? license.screenAccess : license.enabledModules;
            const displayedModules = modulesList.slice(0, 5);
            const remainingModulesCount = modulesList.length - displayedModules.length;
            return (
              <div className="account-module-list" style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                {displayedModules.map((item) => <Badge key={item}>{item}</Badge>)}
                {remainingModulesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedLicenseModules({ planName: license.planName, modules: modulesList })}
                    className="license-modules-more-btn"
                  >
                    +{remainingModulesCount} özellik
                  </button>
                )}
              </div>
            );
          })()}
          <div className="account-actions">
            <PanelAccessButton licenseStatus={license.status} activationStatus={license.activationStatus} />
            <Button
              disabled={exportLoadingId === license.id || hasOpenExport(license.id) || !["active", "pending"].includes(license.status)}
              onClick={() => void handleDataExportRequest(license)}
              type="button"
              variant="outline"
            >
              {exportLoadingId === license.id ? "Talep oluşturuluyor..." : hasOpenExport(license.id) ? "Mağaza verisi hazırlanıyor" : "Mağaza Verilerini Talep Et"}
            </Button>
            <Button
              href={license.status === "pending" ? `${routes.accountActivation}?key=${license.maskedKey}` : undefined}
              disabled={license.status !== "pending"}
              variant="outline"
            >
              Lisans Aktivasyonu
            </Button>
            <Button disabled={!getAvailablePlanChanges(license.planSlug).length || Boolean(license.pendingPlanChange)} onClick={() => openUpgrade(license)} type="button" variant="outline">Plan Düzenle</Button>
            {license.status === "active" || license.status === "pending" ? (
              <Button
                onClick={() => setCancellingLicenseId(license.id)}
                variant="outline"
                style={{ borderColor: "var(--danger-color, #ef4444)", color: "var(--danger-color, #ef4444)" }}
              >
                Lisansı İptal Et
              </Button>
            ) : null}
            <Button href={routes.accountSupport} variant="outline">Destek Al</Button>
          </div>
          {(() => {
            const exp = latestExportForLicense(license.id);
            if (!exp) return null;

            // Auto-hide completed/failed cards after 5 minutes
            const isFinished = ["ready", "failed", "rejected", "expired"].includes(exp.status);
            if (isFinished) {
              const elapsedMs = timeTick - new Date(exp.updatedAt).getTime();
              if (elapsedMs >= 5 * 60 * 1000) {
                return null;
              }
            }

            const info = getExportStatusInfo(exp.status, exp.errorMessage);
            return (
              <div className={`form-alert ${info.badgeClass}`} style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: "block", fontSize: "0.95rem", marginBottom: "4px" }}>
                    {info.title}
                  </strong>
                  <span style={{ fontSize: "0.85rem", fontWeight: "normal" }}>
                    {info.desc}
                  </span>
                </div>
                {["pending", "processing"].includes(exp.status) && (
                  <Button
                    onClick={() => void fetchData()}
                    size="sm"
                    type="button"
                    variant="outline"
                    style={{ flexShrink: 0 }}
                  >
                    Durumu Güncelle
                  </Button>
                )}
              </div>
            );
          })()}
          {limitReached && (
            <p className="account-license-explanation" style={{ color: "#f87171", fontSize: "0.825rem", marginTop: "1rem" }}>
              * Planınızdaki mağaza lisans hakkı sınırına ({storeLimit}) ulaştınız. Daha fazla mağaza için planınızı güncelleyin veya kullanılmayan bir mağaza lisansını iptal edin.
            </p>
          )}
        </Card>
      ))}
      {!loading && !error && !licenses.length ? (
        <Card className="account-activation-empty">
          <h2>Henüz hesabınıza bağlı lisans yok.</h2>
          <p>Fiziksel veya dijital lisans anahtarınızı girerek lisansınızı hesabınıza bağlayabilirsiniz.</p>
          <Button href={routes.accountActivation}>Lisans Aktivasyonuna Git</Button>
        </Card>
      ) : null}

      {/* Selected Modules Modal */}
      {selectedLicenseModules && (
        <div className="auth-modal" style={{ zIndex: 9999 }}>
          <div className="auth-modal__backdrop" onClick={() => setSelectedLicenseModules(null)} />
          <div className="auth-modal__panel pricing-features-modal">
            <div className="auth-modal__header" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
              <div>
                <span className="auth-modal__eyebrow">MODÜLLER VE ÖZELLİKLER</span>
                <h2 style={{ fontSize: "1.5rem", color: "var(--color-text-strong)", fontWeight: 800, margin: "4px 0 0 0" }}>
                  {selectedLicenseModules.planName} Planı
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", margin: "4px 0 0" }}>Bu lisans kapsamında aktif olan tüm modüller</p>
              </div>
              <button aria-label="Kapat" className="auth-modal__close" onClick={() => setSelectedLicenseModules(null)} type="button">
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="pricing-features-modal__body">
              <div className="license-module-modal-list">
                {selectedLicenseModules.modules.map((item, index) => (
                  <Badge key={index} style={{ padding: "6px 12px", fontSize: "0.875rem" }}>{item}</Badge>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
              <Button onClick={() => setSelectedLicenseModules(null)} size="sm">Kapat</Button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {upgradeLicense ? (
        <div className="auth-modal">
          <div className="auth-modal__backdrop" onClick={() => setUpgradeLicense(null)} />
          <form className="auth-modal__panel account-upgrade-modal" onSubmit={(event) => void submitUpgrade(event)}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">PLAN DÜZENLE</span>
                <h2>Planınızı güncelleyin</h2>
                <p>Plan değişikliği verilerinizi silmeden bir sonraki dönem için planlanır. Daha düşük veya daha yüksek plan seçebilirsiniz.</p>
              </div>
              <button className="auth-modal__close" onClick={() => setUpgradeLicense(null)} type="button">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="account-upgrade-options">
              {getAvailablePlanChanges(upgradeLicense.planSlug).map((plan) => (
                <label className={upgradePlanSlug === plan.backendSlug ? "is-selected" : undefined} key={plan.id}>
                  <input checked={upgradePlanSlug === plan.backendSlug} onChange={() => setUpgradePlanSlug(plan.backendSlug)} type="radio" />
                  <span>{plan.name}</span>
                  <strong>{plan.priceLabel}</strong>
                  <small>{plan.description}</small>
                </label>
              ))}
            </div>
            <label className="form-field">
              <span>Şifrenizle onaylayın</span>
              <input autoComplete="current-password" onChange={(event) => setUpgradePassword(event.target.value)} type="password" value={upgradePassword} />
            </label>
            {upgradeError ? <p className="form-alert">{upgradeError}</p> : null}
            <div className="account-upgrade-actions">
              <Button onClick={() => setUpgradeLicense(null)} type="button" variant="outline">Vazgeç</Button>
              <Button disabled={upgradeLoading || !upgradePassword || !upgradePlanSlug} type="submit">
                {upgradeLoading ? "Planlanıyor..." : "Planı Güncelle"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Cancel License Confirmation Modal */}
      {cancellingLicenseId && (
        <div className="auth-modal cancel-license-modal" style={{ zIndex: 9999 }}>
          <div className="auth-modal__backdrop" onClick={() => {
            setCancellingLicenseId(null);
            setCancelPassword("");
            setCancelConfirmText("");
            setCancelError("");
          }} />
          <div className="auth-modal__panel cancel-license-modal-panel" style={{ maxWidth: "480px", width: "100%" }}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">İPTAL İŞLEMİ</span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "4px 0 0 0" }}>Lisansı İptal Et</h2>
              </div>
              <button aria-label="Kapat" className="auth-modal__close" onClick={() => {
                setCancellingLicenseId(null);
                setCancelPassword("");
                setCancelConfirmText("");
                setCancelError("");
              }} type="button">
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="form-alert" style={{ marginBottom: "16px" }}>
              <strong style={{ display: "block", fontSize: "0.9rem", marginBottom: "4px" }}>
                UYARI: Ana sistemdeki operasyon verileri silinmez.
              </strong>
              <span style={{ fontSize: "0.85rem", fontWeight: "normal", color: "inherit" }}>
                Lisansınız iptal edilecek, panel erişiminiz sonlandırılacaktır. shelfiolabs üzerindeki stok ve operasyon verileriniz kesinlikle silinmez.
              </span>
            </div>

            <form onSubmit={(e) => void handleCancelSubmit(e)} style={{ display: "grid", gap: "16px" }}>
              {cancelError && (
                <div className="form-error" style={{ marginBottom: "8px" }}>
                  {cancelError}
                </div>
              )}

              <div className="form-field">
                <label htmlFor="cancel-password">
                  Müşteri Şifresi
                </label>
                <input
                  id="cancel-password"
                  required
                  type="password"
                  value={cancelPassword}
                  onChange={(e) => setCancelPassword(e.target.value)}
                  placeholder="Hesap şifrenizi girin"
                />
              </div>

              <div className="form-field">
                <label htmlFor="cancel-confirm-text">
                  Onay Metni (Lütfen <span style={{ color: "var(--color-danger, #ef4444)" }}>IPTAL</span> yazın)
                </label>
                <input
                  id="cancel-confirm-text"
                  required
                  type="text"
                  value={cancelConfirmText}
                  onChange={(e) => setCancelConfirmText(e.target.value)}
                  placeholder="IPTAL"
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
                <Button
                  disabled={cancelLoading}
                  onClick={() => {
                    setCancellingLicenseId(null);
                    setCancelPassword("");
                    setCancelConfirmText("");
                    setCancelError("");
                  }}
                  type="button"
                  variant="outline"
                >
                  Vazgeç
                </Button>
                <Button
                  disabled={cancelLoading || cancelConfirmText !== "IPTAL"}
                  style={{ backgroundColor: "var(--color-danger, #ef4444)", color: "#ffffff", borderColor: "var(--color-danger, #ef4444)" }}
                  type="submit"
                >
                  {cancelLoading ? "İptal ediliyor..." : "Lisansı Kalıcı Olarak İptal Et"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}

function getExportStatusInfo(status: string, reason?: string | null) {
  switch (status) {
    case "pending":
      return {
        title: "Mağaza verisi hazırlanıyor",
        desc: "Talebiniz işleme alındı. Dosya hazır olduğunda size e-posta ile iletilecektir.",
        badgeClass: "form-alert--info",
        label: "Talep alındı"
      };
    case "processing":
      return {
        title: "Mağaza verisi hazırlanıyor",
        desc: "Talebiniz işleme alındı. Dosya hazır olduğunda size e-posta ile iletilecektir.",
        badgeClass: "form-alert--info",
        label: "Hazırlanıyor"
      };
    case "ready":
      return {
        title: "Mağaza verisi hazır",
        desc: "Dışa aktarım dosyası hazırlandı. İndirme bağlantısı e-posta adresinize gönderildi.",
        badgeClass: "form-alert--success",
        label: "E-posta gönderildi"
      };
    case "failed":
      return {
        title: "Dışa aktarım başlatılamadı",
        desc: !reason || reason === "Export işi başlatılamadı."
          ? "Mağaza verisi hazırlanırken bir sorun oluştu. Lütfen durumu güncelleyip tekrar deneyin."
          : reason,
        badgeClass: "form-alert--warning",
        label: "Başarısız"
      };
    case "expired":
      return {
        title: "Dosya indirme süresi doldu",
        desc: "İndirme bağlantısının geçerlilik süresi doldu. Yeni bir dışa aktarım talebi oluşturabilirsiniz.",
        badgeClass: "form-alert--warning",
        label: "Süresi doldu"
      };
    case "rejected":
      return {
        title: "Dışa aktarım talebi reddedildi",
        desc: reason || "Talebiniz yönetici tarafından reddedildi.",
        badgeClass: "form-alert",
        label: "Reddedildi"
      };
    default:
      return {
        title: "Dışa aktarım talebi",
        desc: reason || "Talep durumu güncellendi.",
        badgeClass: "form-alert--info",
        label: status
      };
  }
}

function getAvailablePlanChanges(currentSlug: string) {
  return plans
    .map((plan) => ({ ...plan, backendSlug: plan.id === "starter" ? "baslangic" : plan.id === "professional" ? "profesyonel" : "kurumsal" }))
    .filter((plan) => plan.backendSlug !== currentSlug);
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function remainingTimeLabel(license: AccountLicense) {
  if (license.remainingDays === null) return "Süresiz";
  if (!license.isDemo) return `${license.remainingDays} gün`;
  if (license.status === "expired") return "Demo süresi doldu";
  if (license.remainingDays === 0) return "Demo bugün sona eriyor";
  return `Demo: ${license.remainingDays} gün kaldı`;
}
