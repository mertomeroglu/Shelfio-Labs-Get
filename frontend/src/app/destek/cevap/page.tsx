"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPublicSupportTicket, sendPublicSupportMessage } from "@/services/accountService";
import type { SupportTicketDetail } from "@/types/account";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function PublicSupportReplyPage() {
  return (
    <Suspense fallback={<SupportReplyLoading />}>
      <PublicSupportReplyContent />
    </Suspense>
  );
}

function SupportReplyLoading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          border: "3px solid var(--color-border)",
          borderTopColor: "var(--color-primary)",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px"
        }} />
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>Destek talebi dogrulaniyor ve yukleniyor...</p>
      </div>
    </div>
  );
}

function PublicSupportReplyContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id || !token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Eksik veya geçersiz bağlantı parametreleri.");
      setLoading(false);
      return;
    }

    getPublicSupportTicket(id, token)
      .then((data) => {
        setTicket(data);
      })
      .catch(() => {
        setError("Destek talebi yüklenirken hata oluştu. Bağlantı geçersiz veya süresi dolmuş olabilir.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, token]);

  async function handleSendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !token || !ticket || !reply.trim() || sending) return;

    const messageText = reply.trim();
    setReply("");
    setError("");

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      author: "customer" as const,
      body: messageText,
      createdAt: "Gönderiliyor..."
    };

    const previousTicket = ticket;
    setTicket({
      ...ticket,
      messages: [...ticket.messages, optimisticMessage]
    });

    setSending(true);
    try {
      const updated = await sendPublicSupportMessage(id, token, messageText);
      setTicket(updated);
    } catch {
      setTicket(previousTicket);
      setError("Mesajınız gönderilemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            border: "3px solid var(--color-border)",
            borderTopColor: "var(--color-primary)",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }} />
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>Destek talebi doğrulanıyor ve yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", padding: "20px" }}>
        <Card style={{ maxWidth: "480px", width: "100%", textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }} aria-hidden="true">⚠️</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "12px", color: "var(--color-text-strong)" }}>Erişim Hatası</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "24px" }}>
            {error || "Destek talebine erişim izniniz bulunmuyor."}
          </p>
          <Button href="/" style={{ width: "100%" }}>Ana Sayfaya Dön</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--color-text-muted)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "4px" }}>
          ← Ana Sayfa
        </Link>
      </div>

      <Card padding="lg" style={{ display: "grid", gap: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--color-border)", paddingBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, color: "var(--color-primary)", letterSpacing: "0.05em" }}>Hızlı Destek Girişi</span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "4px 0 6px 0", color: "var(--color-text-strong)" }}>{ticket.subject}</h1>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              Destek No: #{ticket.shortReference || ticket.id.slice(0, 5)} · {ticket.customerEmail}
            </p>
          </div>
          <Badge variant={ticket.status === "Çözüldü" ? "success" : ticket.status === "Yanıtlandı" ? "primary" : "warning"}>
            {ticket.status}
          </Badge>
        </div>

        <div className="support-messages" style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "450px", overflowY: "auto", paddingRight: "8px" }}>
          {ticket.messages.map((message) => (
            <div className={`support-message support-message--${message.author}`} key={message.id}>
              <span>{message.author === "admin" ? "Shelfio destek" : "Siz"} · {message.createdAt}</span>
              <p>{message.body}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendReply} style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px", display: "grid", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--color-text-strong)" }}>Mesajınız</span>
            <textarea
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Yeni bir mesaj veya yanıt yazın..."
              required
              disabled={sending}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--color-background)",
                color: "var(--color-text-body)",
                fontSize: "0.92rem",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
          </label>

          {error ? <p style={{ margin: 0, color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p> : null}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" disabled={sending || !reply.trim()}>
              {sending ? "Gönderiliyor..." : "Mesaj Gönder"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
