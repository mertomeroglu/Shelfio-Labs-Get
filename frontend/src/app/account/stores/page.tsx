"use client";

import { useEffect, useState } from "react";
import type { AccountLicense, DataExportRequest, StoreLicenseRequest, AccountOverview, AccountStoresResult } from "@/types/account";
import { AccountPageHeader, StatusBadge } from "@/components/account/AccountUi";
import { PanelAccessButton } from "@/components/account/PanelAccessButton";
import {
  getStoreLicenses,
  getStoreLicenseRequests,
  createStoreLicenseRequest,
  cancelStoreLicenseRequest,
  cancelAccountLicense,
  getStores,
  getAccountOverview,
  getDataExportRequests,
  createDataExportRequest,
} from "@/services/accountService";
import { startPanelAccess } from "@/services/panelAccessService";
import { routes } from "@/lib/routes";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatLimit, parseLimit } from "@/lib/utils";

export default function AccountStoresPage() {
  const [licenses, setLicenses] = useState<AccountLicense[]>([]);
  const [requests, setRequests] = useState<StoreLicenseRequest[]>([]);
  const [dataExports, setDataExports] = useState<DataExportRequest[]>([]);
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [storesResult, setStoresResult] = useState<AccountStoresResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestedStoreName, setRequestedStoreName] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);

  // License Cancel Modal State
  const [cancellingLicense, setCancellingLicense] = useState<AccountLicense | null>(null);
  const [cancelPassword, setCancelPassword] = useState("");
  const [cancelConfirmText, setCancelConfirmText] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Request Cancel Modal State
  const [cancellingRequest, setCancellingRequest] = useState<StoreLicenseRequest | null>(null);
  const [cancelRequestLoading, setCancelRequestLoading] = useState(false);
  const [cancelRequestError, setCancelRequestError] = useState("");

  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState("");
  const [exportLoadingId, setExportLoadingId] = useState("");
  const [exportMessage, setExportMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [nextLicenses, nextRequests, nextOverview, nextStores, nextExports] = await Promise.all([
        getStoreLicenses(),
        getStoreLicenseRequests(),
        getAccountOverview(),
        getStores().catch(() => null),
        getDataExportRequests().catch(() => []),
      ]);
      setLicenses(nextLicenses);
      setRequests(nextRequests);
      setOverview(nextOverview);
      setDataExports(nextExports);
      if (nextStores) {
        setStoresResult(nextStores);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Veriler alınırken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  const [timeTick, setTimeTick] = useState(() => Date.now());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Limits Calculation
  const activeLicense = licenses.find((l) => l.status === "active") || licenses[0];
  const activePlanSlug = activeLicense?.planSlug || (overview?.planName?.toLowerCase().includes("demo") ? "demo" : null);
  const activePlanName = overview?.planName || "Aktif Plan";
  const storeLimit = parseLimit(overview?.storeLimit, activePlanSlug);

  const usedLicensesCount = licenses.filter((l) => l.status === "active" || l.status === "pending").length;
  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;
  const totalUsed = usedLicensesCount + pendingRequestsCount;

  const limitReached = storeLimit !== null && totalUsed >= storeLimit;

  async function handleGoToMainSystem() {
    setSsoLoading(true);
    setSsoError("");
    try {
      const result = await startPanelAccess();
      window.location.assign(result.redirectUrl);
    } catch (caught) {
      setSsoError(caught instanceof Error ? caught.message : "Ana sisteme yönlendirilirken bir hata oluştu.");
    } finally {
      setSsoLoading(false);
    }
  }

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requestedStoreName.trim()) {
      setRequestError("Mağaza adı boş olamaz.");
      return;
    }

    // Check local duplicate guard
    const isDuplicate = requests.some(
      (r) =>
        r.requestedStoreName.toLowerCase() === requestedStoreName.trim().toLowerCase() &&
        (r.status === "pending" || r.status === "approved")
    );
    if (isDuplicate) {
      setRequestError("Bu mağaza adıyla zaten açık veya onaylanmış bir talep bulunuyor.");
      return;
    }

    if (limitReached) {
      setRequestError("Mevcut planınızdaki mağaza lisansı hakkınız dolu.");
      return;
    }

    setRequestLoading(true);
    setRequestError("");
    try {
      await createStoreLicenseRequest({
        requestedStoreName: requestedStoreName.trim(),
        note: requestNote.trim() || undefined,
      });
      setRequestSuccess(true);
      setRequestedStoreName("");
      setRequestNote("");
      // Refresh list
      const [nextRequests, nextOverview] = await Promise.all([
        getStoreLicenseRequests(),
        getAccountOverview(),
      ]);
      setRequests(nextRequests);
      setOverview(nextOverview);
      setTimeout(() => {
        setIsRequestModalOpen(false);
        setRequestSuccess(false);
      }, 1500);
    } catch (caught) {
      setRequestError(caught instanceof Error ? caught.message : "Talep gönderilemedi.");
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleCancelRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cancellingRequest) return;
    setCancelRequestLoading(true);
    setCancelRequestError("");
    try {
      await cancelStoreLicenseRequest(cancellingRequest.id);
      const nextRequests = await getStoreLicenseRequests();
      setRequests(nextRequests);
      setCancellingRequest(null);
    } catch (caught) {
      setCancelRequestError(caught instanceof Error ? caught.message : "Talep iptal edilemedi.");
    } finally {
      setCancelRequestLoading(false);
    }
  }

  async function handleCancelLicenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cancellingLicense) return;
    if (cancelConfirmText !== "IPTAL") {
      setCancelError("Lütfen onay için 'IPTAL' yazın.");
      return;
    }
    setCancelLoading(true);
    setCancelError("");
    try {
      await cancelAccountLicense(cancellingLicense.id, {
        password: cancelPassword,
        confirmText: cancelConfirmText,
      });
      const [nextLicenses, nextOverview] = await Promise.all([
        getStoreLicenses(),
        getAccountOverview(),
      ]);
      setLicenses(nextLicenses);
      setOverview(nextOverview);
      setCancellingLicense(null);
      setCancelPassword("");
      setCancelConfirmText("");
    } catch (caught) {
      setCancelError(caught instanceof Error ? caught.message : "Lisans iptal edilemedi.");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleDataExportRequest(license: AccountLicense) {
    setExportLoadingId(license.id);
    setExportMessage(null);
    try {
      await createDataExportRequest({
        licenseId: license.id,
        storeName: license.storeName || "Ana Mağaza",
      });
      setDataExports(await getDataExportRequests());
      setExportMessage({ text: "Veri talebiniz alındı. Excel hazır olduğunda indirme linki e-posta ile gönderilecek.", type: "success" });
    } catch (caught) {
      setExportMessage({ text: caught instanceof Error ? caught.message : "Veri talebi oluşturulamadı. Lütfen daha sonra tekrar deneyin.", type: "error" });
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

  function getPlanBadgeVariant(slug: string | null): "primary" | "neutral" | "accent" | "warning" {
    if (slug === "demo") return "warning";
    if (slug === "kurumsal" || slug === "enterprise") return "accent";
    if (slug === "baslangic" || slug === "starter") return "neutral";
    return "primary";
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "pending": return "Bekliyor";
      case "approved": return "Onaylandı";
      case "rejected": return "Reddedildi";
      case "cancelled": return "İptal Edildi";
      default: return status;
    }
  }

  return (
    <>
      <AccountPageHeader
        description="Planınızdaki mağaza hakkı kadar mağaza lisansı talep edebilir ve lisans durumlarını takip edebilirsiniz."
        eyebrow="Mağazalarım"
        title="Mağaza Lisansları ve Talepleri"
      />

      <div className="account-actions account-actions--store" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Button onClick={() => {
            setRequestError("");
            setIsRequestModalOpen(true);
          }}>
            Yeni Mağaza Lisansı Talep Et
          </Button>
          <PanelAccessButton variant="outline">Shelfio Panelinde Yönet</PanelAccessButton>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {overview && (
            <Badge variant="neutral" style={{ fontSize: "0.9rem", padding: "8px 16px", height: "auto" }}>
              Kullanım / Hak: <strong style={{ color: "var(--color-primary)", marginLeft: "4px" }}>{totalUsed} / {formatLimit(storeLimit)}</strong>
            </Badge>
          )}

          {storesResult && storesResult.usageStatus === "available" && (
            <Badge variant="neutral" style={{ fontSize: "0.9rem", padding: "8px 16px", height: "auto" }}>
              Ana Sistem Aktif Mağaza: <strong style={{ color: "var(--color-success, #10b981)", marginLeft: "4px" }}>{storesResult.currentStoreCount ?? 0}</strong>
            </Badge>
          )}
        </div>
      </div>

      {error ? <p className="form-alert form-alert--danger" role="alert">{error}</p> : null}
      {ssoError ? <p className="form-alert form-alert--danger" role="alert">{ssoError}</p> : null}
      {exportMessage ? (
        <p className={`form-alert ${exportMessage.type === "success" ? "form-alert--success" : "form-alert--danger"}`} role="status">
          {exportMessage.text}
        </p>
      ) : null}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", marginTop: "24px", marginBottom: "32px" }}>
          {[1, 2].map((i) => (
            <Card key={i} className="skeleton-card" style={{ height: "240px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: "50%", height: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
                <div style={{ width: "60px", height: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "12px" }} />
              </div>
              <div style={{ height: "16px", width: "80%", background: "rgba(255,255,255,0.04)", borderRadius: "4px", marginTop: "12px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
                <div style={{ height: "30px", background: "rgba(255,255,255,0.04)", borderRadius: "6px" }} />
                <div style={{ height: "30px", background: "rgba(255,255,255,0.04)", borderRadius: "6px" }} />
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <div style={{ height: "35px", flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "6px" }} />
                <div style={{ height: "35px", flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "6px" }} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Section 1: Active Store Licenses */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-strong)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Aktif Mağaza Lisansları</span>
              <Badge variant="neutral">{licenses.length}</Badge>
            </h3>

            {!error && licenses.length === 0 ? (
              <Card padding="lg" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                Henüz tanımlı mağaza lisansınız bulunmuyor. Yeni mağaza lisansı talep edebilirsiniz.
              </Card>
            ) : (
              <div className="account-store-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                {licenses.map((license) => (
                  <Card className="account-store-card" key={license.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div className="account-card-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                          <p className="eyebrow" style={{ fontSize: "0.8rem", color: "var(--color-primary)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", margin: 0 }}>
                            {license.planName} Planı
                          </p>
                          <h2 style={{ fontSize: "1.2rem", margin: "4px 0", color: "var(--color-text-strong)" }}>
                            {license.storeName || "Ana Mağaza"}
                          </h2>
                          <code style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", backgroundColor: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px", wordBreak: "break-all" }}>
                            {license.maskedKey}
                          </code>
                        </div>
                        <StatusBadge status={license.status} />
                      </div>

                      <div className="account-detail-grid" style={{ fontSize: "0.85rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", borderTop: "1px solid var(--color-border)", paddingTop: "12px", marginBottom: "12px" }}>
                        <div>
                          <span style={{ display: "block", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Aktivasyon Durumu</span>
                          <strong style={{ color: "var(--color-text-strong)" }}>{license.activationStatus}</strong>
                        </div>
                        <div>
                          <span style={{ display: "block", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Başlangıç Tarihi</span>
                          <strong style={{ color: "var(--color-text-strong)" }}>{license.startsAt}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px", borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
                      {license.status === "active" ? (
                        <Button
                          disabled={ssoLoading}
                          onClick={handleGoToMainSystem}
                          size="sm"
                          style={{ flex: "1 1 auto" }}
                        >
                          {ssoLoading ? "Yönlendiriliyor..." : "Sisteme Git"}
                        </Button>
                      ) : (
                        <Button
                          href={`${routes.accountActivation}?key=${license.maskedKey}`}
                          size="sm"
                          style={{ flex: "1 1 auto" }}
                        >
                          Aktive Et
                        </Button>
                      )}
                      <Button
                        disabled={exportLoadingId === license.id || hasOpenExport(license.id) || !["active", "pending"].includes(license.status)}
                        onClick={() => void handleDataExportRequest(license)}
                        variant="outline"
                        size="sm"
                        style={{ flex: "1 1 auto" }}
                        title={hasOpenExport(license.id) ? "Devam eden bir veri talebiniz bulunmaktadır." : !["active", "pending"].includes(license.status) ? "Sadece aktif lisanslar için veri talebi yapılabilir." : undefined}
                      >
                        {exportLoadingId === license.id ? "Talep oluşturuluyor..." : hasOpenExport(license.id) ? "Mağaza verisi hazırlanıyor" : "Mağaza Verilerini Talep Et"}
                      </Button>
                      <Button
                        onClick={() => {
                          setCancelError("");
                          setCancelPassword("");
                          setCancelConfirmText("");
                          setCancellingLicense(license);
                        }}
                        variant="outline"
                        size="sm"
                        style={{ borderColor: "var(--color-danger, #ef4444)", color: "var(--color-danger, #ef4444)", flex: "1 1 auto" }}
                      >
                        Pasifleştir / İptal Et
                      </Button>
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
                        <div className={`form-alert ${info.badgeClass}`} style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ display: "block", fontSize: "0.9rem", marginBottom: "2px" }}>
                              {info.title}
                            </strong>
                            <span style={{ fontSize: "0.8rem", fontWeight: "normal" }}>
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
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Store License Requests */}
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-strong)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Mağaza Talepleri Geçmişi</span>
              <Badge variant="neutral">{requests.length}</Badge>
            </h3>

            {requests.length === 0 ? (
              <Card padding="lg" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                Henüz mağaza lisansı talebi geçmişiniz bulunmuyor.
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {requests.map((req) => (
                  <Card key={req.id} style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "16px", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "1.1rem", color: "var(--color-text-strong)" }}>{req.requestedStoreName}</strong>
                        <Badge variant={getPlanBadgeVariant(req.planSlug)}>{req.planSlug ? req.planSlug.toUpperCase() : ""}</Badge>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                        <span>Talep Tarihi: {new Date(req.createdAt).toLocaleDateString("tr-TR")}</span>
                        {req.note && <span style={{ marginLeft: "16px" }}>Not: {req.note}</span>}
                        {req.adminNote && <span style={{ marginLeft: "16px", color: "var(--color-warning)" }}>Admin Notu: {req.adminNote}</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: req.status === "pending"
                          ? "#f59e0b"
                          : req.status === "approved"
                            ? "#10b981"
                            : req.status === "rejected"
                              ? "#ef4444"
                              : "#94a3b8"
                      }}>
                        {getStatusLabel(req.status)}
                      </span>

                      {req.status === "pending" && (
                        <Button
                          onClick={() => {
                            setCancelRequestError("");
                            setCancellingRequest(req);
                          }}
                          variant="outline"
                          size="sm"
                          style={{ borderColor: "#ef4444", color: "#ef4444" }}
                        >
                          İptal Et
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 1. Request Store License Modal */}
      {isRequestModalOpen && (
        <div className="auth-modal" style={{ zIndex: 9999 }}>
          <div className="auth-modal__backdrop" onClick={() => setIsRequestModalOpen(false)} />
          <div className="auth-modal__panel" style={{ maxWidth: "480px", width: "100%" }}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">TALEP FORMU</span>
                <h2 style={{ fontSize: "1.3rem", margin: "4px 0", fontWeight: 800 }}>Yeni Mağaza Lisansı Talep Et</h2>
              </div>
              <button
                className="auth-modal__close"
                onClick={() => setIsRequestModalOpen(false)}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {limitReached ? (
              // Modal B - Limit Reached State
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "20px" }}>
                  Mevcut planınızdaki mağaza lisansı hakkınız dolu. Daha fazla mağaza için planınızı güncelleyin.
                </p>
                <div className="form-alert form-alert--warning" style={{ marginBottom: "24px" }}>
                  Kullanılan / Limit: {totalUsed} / {formatLimit(storeLimit, activePlanSlug, "store")}
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <Button onClick={() => setIsRequestModalOpen(false)} variant="outline">
                    Vazgeç
                  </Button>
                  <Button href={routes.accountLicenses}>
                    Planı Düzenle
                  </Button>
                </div>
              </div>
            ) : (
              // Modal C - Form State
              <form onSubmit={(e) => void handleRequestSubmit(e)} style={{ marginTop: "16px", display: "grid", gap: "16px" }}>
                {requestError && (
                  <div className="form-error">
                    {requestError}
                  </div>
                )}
                {requestSuccess && (
                  <div className="form-alert form-alert--success">
                    Talep başarıyla oluşturuldu. Yönlendiriliyor...
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-field">
                    <label htmlFor="active-plan-name">Aktif Plan</label>
                    <input
                      id="active-plan-name"
                      type="text"
                      readOnly
                      value={activePlanName}
                      disabled
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="usage-status-info">Kullanım Durumu</label>
                    <input
                      id="usage-status-info"
                      type="text"
                      readOnly
                      value={`Kullanım: ${totalUsed} / ${formatLimit(storeLimit, activePlanSlug, "store")}`}
                      disabled
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="request-store-name">
                    Mağaza Adı <span>*</span>
                  </label>
                  <input
                    id="request-store-name"
                    required
                    type="text"
                    placeholder="Örn: Kadıköy Şubesi"
                    value={requestedStoreName}
                    onChange={(e) => setRequestedStoreName(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="request-note">
                    Talep Notu / Açıklama <span>opsiyonel</span>
                  </label>
                  <textarea
                    id="request-note"
                    placeholder="Talebinize eklemek istediğiniz detaylar..."
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <Button
                    onClick={() => setIsRequestModalOpen(false)}
                    type="button"
                    variant="outline"
                  >
                    İptal
                  </Button>
                  <Button
                    disabled={requestLoading || requestSuccess}
                    type="submit"
                  >
                    {requestLoading ? "Gönderiliyor..." : "Talep Oluştur"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. Soft Modal Confirmation for Cancel Request */}
      {cancellingRequest && (
        <div className="auth-modal" style={{ zIndex: 9999 }}>
          <div className="auth-modal__backdrop" onClick={() => setCancellingRequest(null)} />
          <div className="auth-modal__panel" style={{ maxWidth: "440px", width: "100%" }}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">TALEP İPTALİ</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "4px 0 0 0" }}>Talebi İptal Et</h2>
              </div>
              <button aria-label="Kapat" className="auth-modal__close" onClick={() => setCancellingRequest(null)} type="button">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>
              <strong>{cancellingRequest.requestedStoreName}</strong> mağazası için yaptığınız lisans talebini iptal etmek istediğinize emin misiniz?
            </p>

            <form onSubmit={(e) => void handleCancelRequestSubmit(e)} style={{ display: "grid", gap: "16px" }}>
              {cancelRequestError && (
                <div className="form-error">
                  {cancelRequestError}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <Button
                  disabled={cancelRequestLoading}
                  onClick={() => setCancellingRequest(null)}
                  type="button"
                  variant="outline"
                >
                  Vazgeç
                </Button>
                <Button
                  disabled={cancelRequestLoading}
                  style={{ backgroundColor: "var(--color-danger, #ef4444)", color: "#ffffff", borderColor: "var(--color-danger, #ef4444)" }}
                  type="submit"
                >
                  {cancelRequestLoading ? "İptal ediliyor..." : "Talebi İptal Et"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Soft Modal Confirmation for Cancel/Passivate License */}
      {cancellingLicense && (
        <div className="auth-modal" style={{ zIndex: 9999 }}>
          <div className="auth-modal__backdrop" onClick={() => setCancellingLicense(null)} />
          <div className="auth-modal__panel" style={{ maxWidth: "480px", width: "100%" }}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">İPTAL İŞLEMİ</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "4px 0 0 0" }}>Lisansı İptal Et / Pasifleştir</h2>
              </div>
              <button aria-label="Kapat" className="auth-modal__close" onClick={() => setCancellingLicense(null)} type="button">
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="form-alert" style={{ marginBottom: "16px" }}>
              <strong style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px" }}>
                UYARI: Ana sistemdeki operasyon verileri silinmez.
              </strong>
              <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "inherit" }}>
                Bu mağaza lisansı iptal edildiğinde panel erişimi durdurulur ancak shelfiolabs üzerindeki stok, POS, kullanıcı ve operasyon verileriniz korunur.
              </span>
            </div>

            <form onSubmit={(e) => void handleCancelLicenseSubmit(e)} style={{ display: "grid", gap: "16px" }}>
              {cancelError && (
                <div className="form-error">
                  {cancelError}
                </div>
              )}

              <div className="form-field">
                <label htmlFor="cancel-license-password">
                  Hesap Şifreniz
                </label>
                <input
                  id="cancel-license-password"
                  required
                  type="password"
                  value={cancelPassword}
                  onChange={(e) => setCancelPassword(e.target.value)}
                  placeholder="İşlemi doğrulamak için şifrenizi girin"
                />
              </div>

              <div className="form-field">
                <label htmlFor="cancel-license-confirm-text">
                  Onaylama (Devam etmek için lütfen <strong style={{ color: "var(--color-danger, #ef4444)" }}>IPTAL</strong> yazın)
                </label>
                <input
                  id="cancel-license-confirm-text"
                  required
                  type="text"
                  value={cancelConfirmText}
                  onChange={(e) => setCancelConfirmText(e.target.value)}
                  placeholder="IPTAL"
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <Button
                  disabled={cancelLoading}
                  onClick={() => setCancellingLicense(null)}
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
                  {cancelLoading ? "Pasifleştiriliyor..." : "Lisansı İptal Et"}
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
