"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminDemoRequest } from "@/services/adminService";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { approveAdminDemoRequest, getAdminDemoRequests, rejectAdminDemoRequest } from "@/services/adminService";

export default function AdminDemoRequestsPage() {
  const [requests, setRequests] = useState<AdminDemoRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AdminDemoRequest | null>(null);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  async function refreshRequests() {
    const nextRequests = await getAdminDemoRequests();
    setRequests(nextRequests);
    setSelectedRequest((current) => current ? nextRequests.find((item) => item.id === current.id) ?? null : null);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshRequests()
      .then(() => {
        setError("");
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Demo talepleri alınamadı.");
      });
  }, []);

  async function approveRequest(id: string) {
    setProcessingId(id);
    setError("");
    try {
      await approveAdminDemoRequest(id);
      await refreshRequests();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Demo talebi onaylanamadı.");
    } finally {
      setProcessingId("");
    }
  }

  function startRejectRequest(id: string) {
    setRejectingId(id);
  }

  async function rejectRequest(id: string, reason: string) {
    setRejectingId(null);
    setProcessingId(id);
    setError("");
    try {
      await rejectAdminDemoRequest(id, reason);
      await refreshRequests();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Demo talebi reddedilemedi.");
    } finally {
      setProcessingId("");
    }
  }

  return (
    <>
      <AdminPageHeader
        description="Satış ekibinin takip edeceği demo taleplerini düzenli ve hızlı biçimde inceleyin."
        title="Demo Talepleri"
      />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="admin-data-table-wrap">
        <table className="admin-data-table admin-data-table--demo-requests">
          <colgroup>
            <col className="admin-demo-col--ref" />
            <col className="admin-demo-col--company" />
            <col className="admin-demo-col--contact" />
            <col className="admin-demo-col--stores" />
            <col className="admin-demo-col--status" />
            <col className="admin-demo-col--date" />
            <col className="admin-demo-col--action" />
          </colgroup>
          <thead>
            <tr>
              <th>Referans</th>
              <th>Firma</th>
              <th>İletişim</th>
              <th>Mağaza</th>
              <th>Durum</th>
              <th>Tarih</th>
              <th>Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td><span className="admin-truncate admin-mono" title={request.referenceId || request.id}>{request.referenceId || request.id}</span></td>
                <td><strong className="admin-truncate" title={request.company}>{request.company}</strong></td>
                <td><span className="admin-truncate" title={request.contact}>{request.contact}</span></td>
                <td>{request.storeCount}</td>
                <td><span className={`admin-status-badge ${statusClass(request.status)}`}>{request.status}</span></td>
                <td>{request.createdAt}</td>
                <td>
                  <div className="admin-table-actions">
                    <button className="admin-detail-button" onClick={() => setSelectedRequest(request)} type="button">Detay</button>
                    {request.status === "Yeni" ? (
                      <>
                        <button className="admin-table-action admin-table-action--success" disabled={processingId === request.id} onClick={() => void approveRequest(request.id)} type="button">Onayla</button>
                        <button className="admin-table-action admin-table-action--danger" disabled={processingId === request.id} onClick={() => startRejectRequest(request.id)} type="button">Reddet</button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!requests.length ? <div className="admin-empty-state">Henüz demo talebi bulunmuyor.</div> : null}
      </div>
      {selectedRequest ? (
        <DetailDrawer onClose={() => setSelectedRequest(null)}>
          <Detail label="Referans" mono value={selectedRequest.referenceId || selectedRequest.id} />
          <Detail label="Firma" value={selectedRequest.company} />
          <Detail label="İletişim e-postası" value={selectedRequest.contact} />
          <Detail label="Mağaza sayısı" value={String(selectedRequest.storeCount)} />
          <Detail label="Talep tarihi" value={selectedRequest.createdAt} />
          <div className="admin-drawer__detail">
            <span>Durum</span>
            <span className={`admin-status-badge ${statusClass(selectedRequest.status)}`}>{selectedRequest.status}</span>
          </div>
          {selectedRequest.licenseId ? <Detail label="Demo lisans" mono value={selectedRequest.licenseId} /> : null}
          {selectedRequest.rejectionReason ? <Detail label="Red notu" value={selectedRequest.rejectionReason} /> : null}
          {selectedRequest.status === "Yeni" ? (
            <div className="admin-drawer-actions">
              <button className="admin-secondary-action-button" disabled={processingId === selectedRequest.id} onClick={() => void approveRequest(selectedRequest.id)} type="button">Onayla ve Demo Lisansı Oluştur</button>
              <button className="admin-revoke-button" disabled={processingId === selectedRequest.id} onClick={() => startRejectRequest(selectedRequest.id)} type="button">Reddet</button>
            </div>
          ) : null}
        </DetailDrawer>
      ) : null}

      {rejectingId && (
        <RejectModal
          onClose={() => setRejectingId(null)}
          onReject={(reason) => void rejectRequest(rejectingId, reason)}
        />
      )}
    </>
  );
}

function statusClass(status: string) {
  if (status === "Onaylandı") return "is-active";
  if (status === "Reddedildi") return "is-inactive";
  return "is-pending";
}

function Detail({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return <div className="admin-drawer__detail"><span>{label}</span><strong className={mono ? "admin-mono" : undefined}>{value}</strong></div>;
}

function DetailDrawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div aria-labelledby="demo-drawer-title" aria-modal="true" className="admin-drawer" role="dialog">
      <button aria-label="Detay penceresini kapat" className="admin-drawer__backdrop" onClick={onClose} type="button" />
      <aside className="admin-drawer__panel">
        <div className="admin-drawer__header">
          <div><span>Demo talebi</span><h2 id="demo-drawer-title">Talep Detayı</h2></div>
          <button aria-label="Kapat" className="admin-drawer__close" onClick={onClose} type="button">×</button>
        </div>
        <div className="admin-drawer__content">{children}</div>
      </aside>
    </div>
  );
}

function RejectModal({
  onClose,
  onReject,
}: {
  onClose: () => void;
  onReject: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-labelledby="reject-modal-title"
      aria-modal="true"
      className="auth-modal"
      role="dialog"
      style={{ zIndex: 99999 }}
    >
      <div className="auth-modal__backdrop" onClick={onClose} />
      <div className="auth-modal__panel" style={{ maxWidth: "480px", width: "100%", padding: "24px" }}>
        <div className="auth-modal__header" style={{ marginBottom: "16px", borderBottom: "none", paddingBottom: 0 }}>
          <h2 id="reject-modal-title" style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            Demo talebini reddet
          </h2>
          <button aria-label="Kapat" className="auth-modal__close" onClick={onClose} type="button">×</button>
        </div>
        <p style={{ fontSize: "0.95rem", color: "var(--color-text-body)", marginBottom: "16px", lineHeight: "1.5" }}>
          İsterseniz kullanıcıya iletilecek kısa bir not ekleyebilirsiniz.
        </p>
        <div style={{ marginBottom: "20px" }}>
          <textarea
            ref={textareaRef}
            className="form-control"
            placeholder="Reddetme nedeni veya notu..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-strong)",
              fontFamily: "inherit",
              fontSize: "0.95rem",
              resize: "vertical"
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            className="admin-secondary-action-button"
            onClick={onClose}
            type="button"
            style={{ margin: 0, padding: "8px 16px" }}
          >
            Vazgeç
          </button>
          <button
            className="admin-revoke-button"
            onClick={() => onReject(reason)}
            type="button"
            style={{ margin: 0, padding: "8px 16px" }}
          >
            Reddet
          </button>
        </div>
      </div>
    </div>
  );
}
