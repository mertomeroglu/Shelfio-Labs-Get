"use client";

import { useEffect, useRef, useState } from "react";
import type { StoreLicenseRequest } from "@/types/account";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import {
  getAdminStoreLicenseRequests,
  approveStoreLicenseRequest,
  rejectStoreLicenseRequest,
} from "@/services/adminService";

export default function AdminStoreRequestsPage() {
  const [requests, setRequests] = useState<StoreLicenseRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<StoreLicenseRequest | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals / Action States
  const [processingId, setProcessingId] = useState("");
  const [approvingRequest, setApprovingRequest] = useState<StoreLicenseRequest | null>(null);
  const [approveNote, setApproveNote] = useState("");
  
  // Creation success state (holds the generated raw key)
  const [approvedResult, setApprovedResult] = useState<{
    licenseKey: string;
    maskedKey: string;
    mailSent?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [rejectingRequest, setRejectingRequest] = useState<StoreLicenseRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function refreshRequests() {
    setLoading(true);
    try {
      const nextRequests = await getAdminStoreLicenseRequests();
      setRequests(nextRequests);
      // Update selected if open
      setSelectedRequest((current) =>
        current ? nextRequests.find((item) => item.id === current.id) ?? null : null
      );
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Talepler alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshRequests();
  }, []);

  async function handleApproveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!approvingRequest) return;
    setProcessingId(approvingRequest.id);
    setError("");
    try {
      const res = await approveStoreLicenseRequest(approvingRequest.id, {
        adminNote: approveNote.trim() || undefined,
      });
      setApprovedResult({
        licenseKey: res.licenseKey,
        maskedKey: res.maskedKey,
        mailSent: res.mailSent,
      });
      setApproveNote("");
      // Keep approvingRequest open for raw key display, but refresh background
      const nextRequests = await getAdminStoreLicenseRequests();
      setRequests(nextRequests);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Talep onaylanamadı.");
      setApprovingRequest(null);
    } finally {
      setProcessingId("");
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingRequest) return;
    setProcessingId(rejectingRequest.id);
    setError("");
    try {
      await rejectStoreLicenseRequest(rejectingRequest.id, {
        adminNote: rejectReason.trim() || undefined,
      });
      setRejectingRequest(null);
      setRejectReason("");
      await refreshRequests();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Talep reddedilemedi.");
      setRejectingRequest(null);
    } finally {
      setProcessingId("");
    }
  }

  function handleCopyKey() {
    if (!approvedResult?.licenseKey) return;
    void navigator.clipboard.writeText(approvedResult.licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatLimit(limit: number | string | null | undefined) {
    if (limit === null || limit === undefined || limit === 999 || limit === "999" || limit === "unlimited" || String(limit).toLowerCase() === "unlimited") {
      return "Sınırsız";
    }
    return String(limit);
  }

  function statusClass(status: string) {
    if (status === "approved") return "is-active";
    if (status === "rejected") return "is-inactive";
    if (status === "cancelled") return "is-inactive";
    return "is-pending";
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
      <AdminPageHeader
        description="Müşterilerin ek mağaza lisansı taleplerini inceleyin, onaylayın veya reddedin."
        title="Mağaza Talepleri"
      />

      {error ? <p className="form-error" style={{ marginBottom: "20px" }}>{error}</p> : null}

      <div className="admin-data-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Müşteri Bilgisi</th>
              <th>Talep Edilen Mağaza</th>
              <th>Plan</th>
              <th>Kullanım (X / Y)</th>
              <th>Talep Tarihi</th>
              <th>Durum</th>
              <th style={{ width: "240px", textAlign: "right" }}>Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", maxWidth: "160px" }}>
                    <strong className="admin-truncate" title={request.tenantName || "Müşteri"} style={{ color: "var(--color-text-strong)" }}>{request.tenantName || "Müşteri"}</strong>
                    <span className="admin-truncate" title={request.customerEmail || ""} style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{request.customerEmail}</span>
                  </div>
                </td>
                <td>
                  <strong className="admin-truncate" title={request.requestedStoreName} style={{ color: "var(--color-text-strong)", maxWidth: "180px" }}>{request.requestedStoreName}</strong>
                </td>
                <td>
                  <span className="admin-mono">{request.planSlug ? request.planSlug.toUpperCase() : ""}</span>
                </td>
                <td>
                  {request.tenantUsedStoreLicenses !== undefined ? (
                    <span>
                      {request.tenantUsedStoreLicenses} / {formatLimit(request.tenantStoreLimit)}
                    </span>
                  ) : "-"}
                </td>
                <td>
                  <span style={{ fontSize: "0.85rem" }}>
                    {new Date(request.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </td>
                <td>
                  <span className={`admin-status-badge ${statusClass(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </td>
                <td style={{ width: "240px", minWidth: "240px" }}>
                  <div className="admin-table-actions" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", flexWrap: "nowrap" }}>
                    <button
                      className="admin-detail-button"
                      onClick={() => setSelectedRequest(request)}
                      type="button"
                    >
                      Detay
                    </button>
                    {request.status === "pending" && (
                      <>
                        <button
                          className="admin-table-action admin-table-action--success"
                          disabled={processingId === request.id}
                          onClick={() => {
                            setApprovedResult(null);
                            setApproveNote("");
                            setApprovingRequest(request);
                          }}
                          type="button"
                        >
                          Onayla
                        </button>
                        <button
                          className="admin-table-action admin-table-action--danger"
                          disabled={processingId === request.id}
                          onClick={() => {
                            setRejectReason("");
                            setRejectingRequest(request);
                          }}
                          type="button"
                        >
                          Reddet
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>Yükleniyor...</div>
        ) : null}
        {!loading && !requests.length ? (
          <div className="admin-empty-state">Henüz mağaza lisansı talebi bulunmuyor.</div>
        ) : null}
      </div>

      {/* Detail Drawer */}
      {selectedRequest ? (
        <DetailDrawer onClose={() => setSelectedRequest(null)}>
          <Detail label="Talep ID" mono value={selectedRequest.id} />
          <Detail label="Müşteri Adı / Firma" value={selectedRequest.tenantName || "Müşteri"} />
          <Detail label="Müşteri E-postası" value={selectedRequest.customerEmail || ""} />
          <Detail label="Talep Eden Kullanıcı" value={selectedRequest.requestedByUserName || ""} />
          <Detail label="Talep Edilen Mağaza" value={selectedRequest.requestedStoreName} />
          <Detail label="Plan" value={selectedRequest.planSlug ? selectedRequest.planSlug.toUpperCase() : ""} />
          
          <div className="admin-drawer__detail">
            <span>Mevcut Kullanım / Limit</span>
            <strong>
              {selectedRequest.tenantUsedStoreLicenses} / {formatLimit(selectedRequest.tenantStoreLimit)}
            </strong>
          </div>

          <Detail label="Talep Tarihi" value={new Date(selectedRequest.createdAt).toLocaleString("tr-TR")} />
          
          <div className="admin-drawer__detail">
            <span>Durum</span>
            <span className={`admin-status-badge ${statusClass(selectedRequest.status)}`}>
              {getStatusLabel(selectedRequest.status)}
            </span>
          </div>

          {selectedRequest.note && <Detail label="Müşteri Notu" value={selectedRequest.note} />}
          {selectedRequest.adminNote && <Detail label="Admin Karar Notu" value={selectedRequest.adminNote} />}
          {selectedRequest.decidedAt && (
            <Detail label="Karar Tarihi" value={new Date(selectedRequest.decidedAt).toLocaleString("tr-TR")} />
          )}

          {selectedRequest.status === "pending" && (
            <div className="admin-drawer-actions" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                className="admin-secondary-action-button"
                style={{ flex: 1 }}
                disabled={processingId === selectedRequest.id}
                onClick={() => {
                  setApprovedResult(null);
                  setApproveNote("");
                  setApprovingRequest(selectedRequest);
                }}
                type="button"
              >
                Onayla
              </button>
              <button
                className="admin-revoke-button"
                style={{ flex: 1 }}
                disabled={processingId === selectedRequest.id}
                onClick={() => {
                  setRejectReason("");
                  setRejectingRequest(selectedRequest);
                }}
                type="button"
              >
                Reddet
              </button>
            </div>
          )}
        </DetailDrawer>
      ) : null}

      {/* Approve Modal with Creation-time Key copy option */}
      {approvingRequest && (
        <div className="auth-modal" style={{ zIndex: 99999 }}>
          <div className="auth-modal__backdrop" onClick={() => {
            if (!approvedResult) setApprovingRequest(null);
          }} />
          <div className="auth-modal__panel" style={{ maxWidth: "480px", width: "100%" }}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">YÖNETİM</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                  Mağaza Lisansı Talebini Onayla
                </h2>
              </div>
              {!approvedResult && (
                <button
                  aria-label="Kapat"
                  className="auth-modal__close"
                  onClick={() => setApprovingRequest(null)}
                  type="button"
                >
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </div>

            {approvedResult ? (
              // Success creation-time view
              <div style={{ marginTop: "16px" }}>
                <div className="form-alert form-alert--success" style={{ marginBottom: "20px" }}>
                  <strong style={{ display: "block", fontSize: "0.95rem", marginBottom: "4px" }}>
                    Talep Başarıyla Onaylandı!
                  </strong>
                  <span style={{ fontSize: "0.85rem", fontWeight: "normal" }}>
                    Lisans anahtarı müşteriye e-posta ile iletildi.
                  </span>
                </div>

                <div className="form-field" style={{ marginBottom: "20px" }}>
                  <label htmlFor="approved-license-key">
                    Üretilen Lisans Anahtarı
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      id="approved-license-key"
                      readOnly
                      type="text"
                      value={approvedResult.licenseKey}
                      style={{ flex: 1, fontFamily: "monospace", fontSize: "0.95rem" }}
                    />
                    <button
                      className="admin-detail-button"
                      onClick={handleCopyKey}
                      type="button"
                      style={{ padding: "10px 16px", flexShrink: 0 }}
                    >
                      {copied ? "Kopyalandı" : "Kopyala"}
                    </button>
                  </div>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", fontWeight: "normal", marginTop: "4px" }}>
                    Lisans anahtarı güvenlik nedeniyle yalnızca bu ekranda tam olarak gösterilir.
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="admin-revoke-button"
                    onClick={() => {
                      setApprovingRequest(null);
                      setApprovedResult(null);
                      setSelectedRequest(null);
                      void refreshRequests();
                    }}
                    type="button"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            ) : (
              // Form to enter optional note
              <form onSubmit={(e) => void handleApproveSubmit(e)} style={{ marginTop: "16px", display: "grid", gap: "16px" }}>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: "1.5" }}>
                  <strong>{approvingRequest.requestedStoreName}</strong> mağazası için ek lisans talebini onaylıyorsunuz. Müşterinin planına bağlı yeni bir lisans anahtarı üretilecektir.
                </p>

                <div className="form-field">
                  <label htmlFor="approve-note">
                    Admin Onay Notu <span>opsiyonel</span>
                  </label>
                  <textarea
                    id="approve-note"
                    placeholder="Müşteriye ve sistem kayıtlarına eklenecek not..."
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    className="admin-detail-button"
                    onClick={() => setApprovingRequest(null)}
                    type="button"
                  >
                    Vazgeç
                  </button>
                  <button
                    className="admin-detail-button"
                    disabled={processingId === approvingRequest.id}
                    type="submit"
                    style={{ background: "var(--color-success, #10b981)", color: "#ffffff", borderColor: "var(--color-success, #10b981)" }}
                  >
                    {processingId ? "Onaylanıyor..." : "Onayla ve Lisans Üret"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingRequest && (
        <div className="auth-modal" style={{ zIndex: 99999 }}>
          <div className="auth-modal__backdrop" onClick={() => setRejectingRequest(null)} />
          <div className="auth-modal__panel" style={{ maxWidth: "480px", width: "100%" }}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">YÖNETİM</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                  Mağaza Lisansı Talebini Reddet
                </h2>
              </div>
              <button
                aria-label="Kapat"
                className="auth-modal__close"
                onClick={() => setRejectingRequest(null)}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <form onSubmit={(e) => void handleRejectSubmit(e)} style={{ marginTop: "16px", display: "grid", gap: "16px" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: "1.5" }}>
                <strong>{rejectingRequest.requestedStoreName}</strong> mağazası için yapılan ek lisans talebini reddetmek üzeresiniz. Müşteriye iletilecek red sebebini girebilirsiniz.
              </p>

              <div className="form-field">
                <label htmlFor="reject-reason">
                  Reddetme Gerekçesi / Notu <span>opsiyonel</span>
                </label>
                <textarea
                  id="reject-reason"
                  placeholder="Müşteriye e-posta ile gönderilecek gerekçe notu..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  className="admin-detail-button"
                  onClick={() => setRejectingRequest(null)}
                  type="button"
                >
                  Vazgeç
                </button>
                <button
                  className="admin-revoke-button"
                  disabled={processingId === rejectingRequest.id}
                  type="submit"
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
    <div aria-labelledby="store-drawer-title" aria-modal="true" className="admin-drawer" role="dialog">
      <button aria-label="Detay penceresini kapat" className="admin-drawer__backdrop" onClick={onClose} type="button" />
      <aside className="admin-drawer__panel" ref={drawerRef} tabIndex={-1} style={{ outline: "none" }}>
        <div className="admin-drawer__header">
          <div><span>Mağaza Talebi</span><h2 id="store-drawer-title">Talep Detayları</h2></div>
          <button aria-label="Kapat" className="admin-drawer__close" onClick={onClose} type="button">×</button>
        </div>
        <div className="admin-drawer__content">{children}</div>
      </aside>
    </div>
  );
}
