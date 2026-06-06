"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAdminSentMailLogs, sendAdminMail, type AdminSentMailLog } from "@/services/adminService";

export default function AdminMailPage() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<AdminSentMailLog[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function refreshLogs() {
    setLoadingLogs(true);
    try {
      setLogs(await getAdminSentMailLogs());
    } catch {
      setError("Gönderim geçmişi alınamadı.");
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    let active = true;
    getAdminSentMailLogs()
      .then((nextLogs) => {
        if (active) setLogs(nextLogs);
      })
      .catch(() => {
        if (active) setError("Gönderim geçmişi alınamadı.");
      })
      .finally(() => {
        if (active) setLoadingLogs(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSendMail(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (!email.trim() || !subject.trim() || !message.trim()) {
      setError("Alıcı e-posta, konu ve mesaj alanları zorunludur.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Geçerli bir alıcı e-posta adresi girin.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await sendAdminMail({
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      setSuccess("E-posta başarıyla gönderildi.");
      setEmail("");
      setSubject("");
      setMessage("");
      await refreshLogs();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "E-posta gönderilirken bir hata oluştu.");
      await refreshLogs();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        description="Müşterilerinize veya sistem kullanıcılarına doğrudan kurumsal, markalı HTML e-postası gönderin."
        title="Mail Gönder"
        eyebrow="İletişim Portalı"
      />

      <div className="admin-mail-layout">
        <Card className="admin-mail-compose" padding="lg">
          <form className="login-form" onSubmit={handleSendMail} noValidate>
            <div className="form-field">
              <label htmlFor="mail-recipient">Alıcı E-posta</label>
              <input
                disabled={submitting}
                id="mail-recipient"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="musteri@isletme.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div className="form-field">
              <label htmlFor="mail-subject">Konu</label>
              <input
                disabled={submitting}
                id="mail-subject"
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Örn. Shelfio sistem güncellemesi hakkında"
                required
                type="text"
                value={subject}
              />
            </div>

            <div className="form-field">
              <label htmlFor="mail-message">Mesaj</label>
              <textarea
                disabled={submitting}
                id="mail-message"
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Kullanıcıya iletmek istediğiniz mesajı yazın..."
                required
                rows={8}
                value={message}
              />
            </div>

            {error ? <p className="form-error" aria-live="polite">{error}</p> : null}
            {success ? <p className="form-success" aria-live="polite">{success}</p> : null}

            <Button disabled={submitting} size="lg" type="submit">
              {submitting ? "Gönderiliyor..." : "E-posta Gönder"}
            </Button>
          </form>
        </Card>

        <Card className="admin-mail-history" padding="lg">
          <div className="admin-mail-history__header">
            <div>
              <span>Gönderim geçmişi</span>
              <h2>Son Mailler</h2>
            </div>
            <button className="admin-detail-button" disabled={loadingLogs} onClick={() => void refreshLogs()} type="button">
              Yenile
            </button>
          </div>
          <div className="admin-mail-history__list">
            {logs.map((log) => (
              <article className="admin-mail-log" key={log.id}>
                <div className="admin-mail-log__top">
                  <strong title={log.subject}>{log.subject}</strong>
                  <span className={`admin-status-badge ${log.status === "success" ? "is-active" : "is-inactive"}`}>
                    {log.status === "success" ? "Gönderildi" : "Hata"}
                  </span>
                </div>
                <p title={log.recipient}>{log.recipient}</p>
                <small>{new Date(log.sentAt).toLocaleString("tr-TR")}</small>
                {log.errorMessage ? <em>{log.errorMessage}</em> : null}
              </article>
            ))}
            {!logs.length ? (
              <div className="admin-empty-state">
                {loadingLogs ? "Gönderim geçmişi yükleniyor." : "Henüz gönderilmiş mail bulunmuyor."}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </>
  );
}
