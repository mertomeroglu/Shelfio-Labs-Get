"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import {
  getAdminDataExportRequests,
  refreshAdminDataExportRequest,
  resendAdminDataExportMail,
  rejectDataExportRequest,
  retryAdminDataExportRequest,
  type AdminDataExportRequest,
} from "@/services/adminService";

const statusLabels: Record<AdminDataExportRequest["status"], string> = {
  expired: "Süresi doldu",
  failed: "Başarısız",
  pending: "Talep alındı",
  processing: "Hazırlanıyor",
  ready: "E-posta gönderildi",
  rejected: "Reddedildi",
};

export default function AdminDataExportsPage() {
  const [exports, setExports] = useState<AdminDataExportRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<AdminDataExportRequest["status"] | "all">("all");
  const [selectedExport, setSelectedExport] = useState<AdminDataExportRequest | null>(null);
  const [rejectingExport, setRejectingExport] = useState<AdminDataExportRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [message, setMessage] = useState("");

  async function refreshList(options: { silent?: boolean } = {}) {
    if (!options.silent) setLoading(true);
    try {
      const data = await getAdminDataExportRequests();
      setExports(data);
      if (selectedExport) {
        const updatedSelected = data.find((item) => item.id === selectedExport.id);
        if (updatedSelected) setSelectedExport(updatedSelected);
      }
      setError("");
    } catch (caught) {
      if (!options.silent) setError(caught instanceof Error ? caught.message : "Dışa aktarım talepleri alınamadı.");
    } finally {
      if (!options.silent) setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredExports = useMemo(() => {
    if (selectedStatus === "all") return exports;
    return exports.filter((item) => item.status === selectedStatus);
  }, [exports, selectedStatus]);

  async function handleRefreshStatus(id: string) {
    setProcessingId(id);
    setMessage("");
    try {
      const updated = await refreshAdminDataExportRequest(id);
      setExports((current) => current.map((item) => item.id === id ? updated : item));
      setMessage("Talep durumu yenilendi.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Talep durumu yenilenemedi.");
    } finally {
      setProcessingId("");
    }
  }

  async function handleResendMail(id: string) {
    setProcessingId(id);
    setMessage("");
    try {
      const updated = await resendAdminDataExportMail(id);
      setExports((current) => current.map((item) => item.id === id ? updated : item));
      setMessage("İndirme e-postası tekrar gönderildi.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "E-postası tekrar gönderilemedi.");
    } finally {
      setProcessingId("");
    }
  }

  async function handleRetryExport(id: string) {
    setProcessingId(id);
    setMessage("");
    try {
      const updated = await retryAdminDataExportRequest(id);
      setExports((current) => current.map((item) => item.id === id ? updated : item));
      setMessage("Dışa aktarım talebi yeniden başlatıldı.");
      if (selectedExport && selectedExport.id === id) {
        setSelectedExport(updated);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Talebi yeniden başlatılamadı.");
    } finally {
      setProcessingId("");
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingExport) return;
    setProcessingId(rejectingExport.id);
    setError("");
    try {
      const updated = await rejectDataExportRequest(rejectingExport.id, rejectReason.trim());
      setExports((current) => current.map((item) => item.id === rejectingExport.id ? updated : item));
      setRejectingExport(null);
      setRejectReason("");
      setMessage("Dışa aktarım talebi reddedildi.");
      await refreshList({ silent: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Talep reddedilemedi.");
      setRejectingExport(null);
    } finally {
      setProcessingId("");
    }
  }

  return (
    <>
      <AdminPageHeader
        description="Müşterilerin mağaza verisi taleplerini ve hazırlık durumlarını buradan takip edin."
        title="Dışa Aktarım Talepleri"
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(["all", "pending", "processing", "ready", "failed", "expired", "rejected"] as const).map((status) => (
            <button
              className={`admin-detail-button ${selectedStatus === status ? "is-active" : ""}`}
              key={status}
              onClick={() => setSelectedStatus(status)}
              type="button"
              style={{ padding: "8px 14px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600 }}
            >
              {status === "all" ? "Tümü" : statusLabels[status]}
            </button>
          ))}
        </div>
        <button 
          className="admin-detail-button" 
          disabled={loading} 
          onClick={() => void refreshList()} 
          type="button"
          style={{ padding: "8px 16px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600 }}
        >
          Yenile
        </button>
      </div>

      {error ? <p className="form-error" style={{ marginBottom: "16px", padding: "12px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "6px", color: "#f87171" }}>{error}</p> : null}
      {message ? <p className="form-success" style={{ marginBottom: "16px", padding: "12px", backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "6px", color: "#34d399" }}>{message}</p> : null}

      <div className="admin-data-table-wrap" style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "10px", backgroundColor: "var(--color-surface)" }}>
        <table className="admin-data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>Müşteri Bilgisi</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>Mağaza</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>Lisans</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>Durum</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>Talep Tarihi</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 700, width: "420px", textAlign: "right" }}>Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {filteredExports.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", maxWidth: "200px" }}>
                    <strong 
                      style={{ color: "var(--color-text-strong)", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      title={item.tenantName || item.customerName || "Müşteri"}
                    >
                      {item.tenantName || item.customerName || "Müşteri"}
                    </strong>
                    <span 
                      style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      title={item.customerEmail || ""}
                    >
                      {item.customerEmail || "-"}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <strong 
                    style={{ color: "var(--color-text-strong)", fontSize: "0.9rem", display: "block", maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    title={item.storeName}
                  >
                    {item.storeName}
                  </strong>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span className="admin-mono" style={{ fontSize: "0.8rem", backgroundColor: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                    {item.maskedKey || item.externalLicenseId || "-"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span className={`admin-status-badge ${statusClass(item.status)}`} style={{ fontSize: "0.75rem", padding: "4px 8px" }}>
                      {statusLabels[item.status]}
                    </span>
                    {item.errorCode === "mail_send_failed" && (
                      <span style={{ color: "#ef4444", fontSize: "0.72rem", fontWeight: 700, marginTop: "4px" }}>
                        E-posta Gönderilemedi
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "var(--color-text-body)" }}>
                  {formatDate(item.createdAt)}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div className="admin-table-actions" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", whiteSpace: "nowrap", flexWrap: "wrap" }}>
                    <button
                      className="admin-detail-button"
                      onClick={() => setSelectedExport(item)}
                      type="button"
                      style={{
                        height: "32px",
                        padding: "0 12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        borderRadius: "6px",
                        border: "1px solid var(--color-primary)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        backgroundColor: "var(--color-primary)",
                        color: "#ffffff"
                      }}
                    >
                      Detay
                    </button>
                    
                    {["pending", "processing"].includes(item.status) ? (
                      <button
                        className="admin-detail-button"
                        disabled={processingId === item.id}
                        onClick={() => void handleRefreshStatus(item.id)}
                        type="button"
                        style={{
                          height: "32px",
                          padding: "0 12px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          backgroundColor: "var(--color-surface-soft)",
                          color: "var(--color-text-strong)",
                          border: "1px solid var(--color-border-strong)"
                        }}
                        title="Durumu Güncelle"
                      >
                        Güncelle
                      </button>
                    ) : (
                      <button
                        className="admin-detail-button"
                        disabled
                        type="button"
                        style={{
                          height: "32px",
                          padding: "0 12px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "not-allowed",
                          backgroundColor: "#f8fafc",
                          color: "#94a3b8",
                          border: "1px solid #e2e8f0"
                        }}
                        title="Durumu Güncelle"
                      >
                        Güncelle
                      </button>
                    )}

                    {item.status === "ready" ? (
                      <button
                        className="admin-table-action"
                        disabled={processingId === item.id}
                        onClick={() => void handleResendMail(item.id)}
                        type="button"
                        style={{
                          height: "32px",
                          padding: "0 12px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          borderRadius: "6px",
                          border: "1px solid var(--color-primary)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          backgroundColor: "var(--color-primary)",
                          color: "#ffffff"
                        }}
                      >
                        Mail Gönder
                      </button>
                    ) : (
                      <button
                        className="admin-table-action"
                        disabled
                        type="button"
                        style={{
                          height: "32px",
                          padding: "0 12px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "not-allowed",
                          backgroundColor: "#f8fafc",
                          color: "#94a3b8",
                          border: "1px solid #e2e8f0"
                        }}
                      >
                        Mail Gönder
                      </button>
                    )}

                    {["failed", "expired", "rejected"].includes(item.status) && (
                      <button
                        className="admin-table-action"
                        disabled={processingId === item.id}
                        onClick={() => void handleRetryExport(item.id)}
                        type="button"
                        style={{
                          height: "32px",
                          padding: "0 12px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          borderRadius: "6px",
                          border: "1px solid #d97706",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          backgroundColor: "#f59e0b",
                          color: "#ffffff"
                        }}
                      >
                        Yeniden Hazırla
                      </button>
                    )}
                    
                    {["pending", "processing"].includes(item.status) && (
                      <button
                        className="admin-table-action admin-table-action--danger"
                        disabled={processingId === item.id}
                        onClick={() => {
                          setRejectReason("");
                          setRejectingExport(item);
                        }}
                        type="button"
                        style={{
                          height: "32px",
                          padding: "0 12px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          borderRadius: "6px",
                          border: "1px solid #dc2626",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          backgroundColor: "#ef4444",
                          color: "#ffffff"
                        }}
                      >
                        Reddet
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && !exports.length ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>Yükleniyor...</div>
        ) : null}
        {!loading && !filteredExports.length ? (
          <div className="admin-empty-state" style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>Bu filtrede dışa aktarım talebi bulunmuyor.</div>
        ) : null}
      </div>

      {/* Details Drawer */}
      {selectedExport ? (
        <DetailDrawer onClose={() => setSelectedExport(null)}>
          <Detail label="Talep ID" mono value={selectedExport.id} />
          <Detail label="Müşteri / İşletme" value={selectedExport.tenantName || selectedExport.customerName || "Müşteri"} />
          <Detail label="E-posta" value={selectedExport.customerEmail || "-"} />
          <Detail label="Mağaza" value={selectedExport.storeName} />
          <Detail label="Bağlı Lisans" mono value={selectedExport.maskedKey || selectedExport.externalLicenseId || "-"} />
          <Detail label="Provider Job ID" mono value={selectedExport.providerJobId || "-"} />
          <Detail label="Link Son Geçerlilik" value={selectedExport.downloadExpiresAt ? formatDate(selectedExport.downloadExpiresAt) : "-"} />
          <Detail label="E-posta Gönderim Tarihi" value={selectedExport.mailSentAt ? formatDate(selectedExport.mailSentAt) : "-"} />
          <Detail label="Talep Tarihi" value={formatDate(selectedExport.createdAt)} />
          
          <div className="admin-drawer__detail">
            <span>Durum</span>
            <span className={`admin-status-badge ${statusClass(selectedExport.status)}`}>
              {statusLabels[selectedExport.status]}
            </span>
          </div>

          {selectedExport.errorCode && (
            <Detail label="Hata Kodu" value={selectedExport.errorCode} />
          )}
          {selectedExport.errorMessage && (
            <Detail label="Hata Detayı" value={selectedExport.errorMessage} />
          )}

          {selectedExport.status === "rejected" && selectedExport.errorMessage && (
            <Detail label="Red Nedeni / Açıklama" value={selectedExport.errorMessage} />
          )}

          {["pending", "processing"].includes(selectedExport.status) && (
            <div className="admin-drawer-actions" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                className="admin-secondary-action-button"
                style={{ flex: 1 }}
                disabled={processingId === selectedExport.id}
                onClick={() => void handleRefreshStatus(selectedExport.id)}
                type="button"
              >
                Durumu Güncelle
              </button>
              <button
                className="admin-revoke-button"
                style={{ flex: 1 }}
                disabled={processingId === selectedExport.id}
                onClick={() => {
                  setRejectReason("");
                  setRejectingExport(selectedExport);
                }}
                type="button"
              >
                Reddet
              </button>
            </div>
          )}

          {["failed", "expired", "rejected"].includes(selectedExport.status) && (
            <div className="admin-drawer-actions" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                className="admin-secondary-action-button"
                style={{ flex: 1, backgroundColor: "#f59e0b", color: "#ffffff", borderColor: "#d97706" }}
                disabled={processingId === selectedExport.id}
                onClick={() => void handleRetryExport(selectedExport.id)}
                type="button"
              >
                Yeniden Hazırla
              </button>
            </div>
          )}
        </DetailDrawer>
      ) : null}

      {/* Reject Modal */}
      {rejectingExport && (
        <div className="auth-modal" style={{ zIndex: 99999, position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="auth-modal__backdrop" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)" }} onClick={() => setRejectingExport(null)} />
          <div className="auth-modal__panel" style={{ position: "relative", maxWidth: "480px", width: "100%", backgroundColor: "#1e293b", color: "#f8fafc", padding: "24px", borderRadius: "12px", border: "1px solid #334155", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)" }}>
            <div className="auth-modal__header" style={{ marginBottom: "16px", borderBottom: "none", paddingBottom: 0 }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                Mağaza Verisi Talebini Reddet
              </h2>
              <button
                aria-label="Kapat"
                className="auth-modal__close"
                onClick={() => setRejectingExport(null)}
                type="button"
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.5rem", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={(e) => void handleRejectSubmit(e)} style={{ marginTop: "16px" }}>
              <p style={{ fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "16px", lineHeight: "1.5" }}>
                <strong>{rejectingExport.storeName}</strong> mağazası için yapılan dışa aktarım talebini reddetmek üzeresiniz. Müşteriye iletilecek red sebebini girebilirsiniz.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", fontWeight: 600, marginBottom: "6px" }}>
                  Reddetme Gerekçesi / Notu <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Opsiyonel)</span>
                </label>
                <textarea
                  placeholder="Müşteriye e-posta ile gönderilecek gerekçe notu..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#ffffff", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  className="admin-secondary-action-button"
                  onClick={() => setRejectingExport(null)}
                  type="button"
                  style={{ margin: 0, padding: "8px 16px" }}
                >
                  Vazgeç
                </button>
                <button
                  className="admin-revoke-button"
                  disabled={processingId === rejectingExport.id}
                  type="submit"
                  style={{ margin: 0, padding: "8px 16px" }}
                >
                  {processingId ? "Reddediliyor..." : "Talebi Reddet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function statusClass(status: AdminDataExportRequest["status"]) {
  if (status === "ready") return "is-active";
  if (status === "failed" || status === "expired" || status === "rejected") return "is-inactive";
  return "is-pending";
}

function Detail({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="admin-drawer__detail">
      <span>{label}</span>
      <strong className={mono ? "admin-mono" : undefined}>{value || "-"}</strong>
    </div>
  );
}

function DetailDrawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    drawerRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div aria-labelledby="export-drawer-title" aria-modal="true" className="admin-drawer" role="dialog">
      <button aria-label="Detay penceresini kapat" className="admin-drawer__backdrop" onClick={onClose} type="button" />
      <aside className="admin-drawer__panel" ref={drawerRef} tabIndex={-1} style={{ outline: "none" }}>
        <div className="admin-drawer__header">
          <div><span>Dışa Aktarım Talebi</span><h2 id="export-drawer-title">Talep Detayları</h2></div>
          <button aria-label="Kapat" className="admin-drawer__close" onClick={onClose} type="button">×</button>
        </div>
        <div className="admin-drawer__content">{children}</div>
      </aside>
    </div>
  );
}
