"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { SupportTicket, SupportTicketDetail } from "@/types/account";
import { getSupportTicket, getSupportTickets, sendSupportMessage, submitSupportRequest } from "@/services/accountService";
import { AccountPageHeader } from "@/components/account/AccountUi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

const SUPPORT_POLL_INTERVAL_MS = 7000;

export default function AccountSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicketDetail | null>(null);
  const [form, setForm] = useState({ message: "", subject: "" });
  const [showModal, setShowModal] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const selectedIdRef = useRef<string | null>(null);
  const isSendingRef = useRef(false);
  const isPollingRef = useRef(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showNewMessageBanner, setShowNewMessageBanner] = useState(false);
  const lastMessagesLengthRef = useRef(0);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !selected?.messages) return;

    const messagesCount = selected.messages.length;
    const oldMessagesCount = lastMessagesLengthRef.current;
    lastMessagesLengthRef.current = messagesCount;

    if (messagesCount === 0) return;

    const threshold = 150;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;

    const lastMessage = selected.messages[messagesCount - 1];
    const isOwnMessage = lastMessage.author === "customer";
    const isFirstLoad = oldMessagesCount === 0;

    if (isFirstLoad || isAtBottom || isOwnMessage) {
      container.scrollTop = container.scrollHeight;
      setShowNewMessageBanner(false);
    } else {
      if (messagesCount > oldMessagesCount) {
        setShowNewMessageBanner(true);
      }
    }
  }, [selected?.messages]);

  const refreshTickets = useCallback(async (options: { silent?: boolean } = {}) => {
    try {
      const nextTickets = await getSupportTickets();
      setTickets(nextTickets);

      const selectedId = selectedIdRef.current;
      if (selectedId && !nextTickets.some((ticket) => ticket.id === selectedId)) {
        selectedIdRef.current = null;
        setSelected(null);
      }
    } catch {
      if (!options.silent) setError("Destek talepleri alÄ±namadÄ±.");
    }
  }, []);

  const refreshSelectedTicket = useCallback(async (options: { silent?: boolean } = {}) => {
    const selectedId = selectedIdRef.current;
    if (!selectedId) return;

    try {
      const nextSelected = await getSupportTicket(selectedId);
      selectedIdRef.current = nextSelected.id;
      setSelected(nextSelected);
    } catch {
      if (!options.silent) setError("Destek talebi detayÄ± alÄ±namadÄ±.");
    }
  }, []);

  const refreshSupportData = useCallback(async (options: { silent?: boolean } = {}) => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      await refreshTickets(options);
      if (!isSendingRef.current) {
        await refreshSelectedTicket(options);
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [refreshSelectedTicket, refreshTickets]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshTickets();
  }, [refreshTickets]);

  useEffect(() => {
    selectedIdRef.current = selected?.id ?? null;
  }, [selected?.id]);

  useEffect(() => {
    isSendingRef.current = isSending;
  }, [isSending]);

  useEffect(() => {
    let intervalId: number | undefined;

    function isVisible() {
      return document.visibilityState === "visible";
    }

    function refetchIfVisible() {
      if (!isVisible()) return;
      void refreshSupportData({ silent: true });
    }

    function stopPolling() {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    }

    function startPolling() {
      stopPolling();
      if (isVisible()) {
        intervalId = window.setInterval(refetchIfVisible, SUPPORT_POLL_INTERVAL_MS);
      }
    }

    function handleVisibilityChange() {
      if (isVisible()) {
        refetchIfVisible();
        startPolling();
      } else {
        stopPolling();
      }
    }

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", refetchIfVisible);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", refetchIfVisible);
    };
  }, [refreshSupportData]);

  async function selectTicket(id: string) {
    if (selected?.id === id) {
      selectedIdRef.current = null;
      setSelected(null);
      setError("");
      return;
    }

    try {
      selectedIdRef.current = id;
      setSelected(await getSupportTicket(id));
      setError("");
    } catch {
      selectedIdRef.current = null;
      setError("Destek talebi detayÄ± alÄ±namadÄ±.");
    }
  }

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Talep konusu ve mesaj alanlarını doldurun.");
      return;
    }
    const result = await submitSupportRequest({
      message: form.message,
      module: "Diğer",
      priority: "Orta",
      subject: form.subject,
    });
    setForm({ message: "", subject: "" });
    setError("");
    setShowModal(false);
    await refreshTickets();
    selectedIdRef.current = result.referenceId;
    setSelected(await getSupportTicket(result.referenceId));
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !reply.trim() || isSending) return;

    const messageText = reply.trim();
    setReply("");
    setError("");
    setIsSending(true);

    try {
      const updated = await sendSupportMessage(selected.id, messageText);
      selectedIdRef.current = updated.id;
      setSelected(updated);
      await refreshTickets({ silent: true });
      await refreshSelectedTicket({ silent: true });
    } catch {
      setReply(messageText);
      setError("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSending(false);
    }
  }

  const getTicketClass = (ticket: SupportTicket) => {
    const classes = ["support-ticket-item"];
    if (selected?.id === ticket.id) classes.push("is-active");
    
    const status = ticket.status;
    if (status === "Yeni") classes.push("status-yeni");
    else if (status === "Yanıt bekliyor") classes.push("status-yanit-bekliyor");
    else if (status === "Yanıtlandı") classes.push("status-yanitlandi");
    else if (status === "Çözüldü") classes.push("status-cozuldu");
    
    return classes.join(" ");
  };

  return (
    <>
      <AccountPageHeader
        description="Destek taleplerinizi oluşturun, yanıtları takip edin ve ekibimizle yazışın."
        eyebrow="Destek"
        title="Destek Merkezi"
      />
      <div className="support-desk">
        <div className="support-workspace">
          <Card className="support-ticket-list" padding="sm">
            <div className="support-list-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Destek Talepleri</h2>
              <Button className="support-create-button" onClick={() => setShowModal(true)} size="sm" iconLeft={<Icon name="plus" style={{ width: 14, height: 14 }} />}>
                Talep Oluştur
              </Button>
            </div>
            {tickets.length === 0 ? (
              <div className="support-empty-state" style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                Henüz destek talebiniz bulunmuyor.
              </div>
            ) : null}
            {tickets.map((ticket) => (
              <button className={getTicketClass(ticket)} key={ticket.id} onClick={() => void selectTicket(ticket.id)} type="button">
                <strong>{ticket.subject}</strong>
                <span>#{ticket.shortReference || ticket.id.slice(0, 5)} · {ticket.updatedAt}</span>
                <div>
                  <Badge variant={ticket.status === "Çözüldü" ? "success" : ticket.status === "Yanıtlandı" ? "primary" : "warning"}>{ticket.status}</Badge>
                  {ticket.unreadForCustomer ? <Badge variant="danger">Yeni yanıt</Badge> : null}
                </div>
              </button>
            ))}
          </Card>
          <Card className="support-thread" padding="lg" style={{ position: "relative" }}>
            {selected ? (
              <>
                <div className="support-thread__header">
                  <div>
                    <h2>{selected.subject}</h2>
                    <p className="support-thread__reference">Destek No: #{selected.shortReference || selected.id.slice(0, 5)}</p>
                  </div>
                  <Badge variant={selected.status === "Çözüldü" ? "success" : selected.status === "Yanıtlandı" ? "primary" : "warning"}>{selected.status}</Badge>
                </div>
                <div className="support-messages" ref={messagesContainerRef}>
                  {selected.messages.map((message) => (
                    <div className={`support-message support-message--${message.author}`} key={message.id}>
                      <span>{message.author === "admin" ? "Shelfio destek" : "Siz"} · {message.createdAt}</span>
                      <p>{message.body}</p>
                    </div>
                  ))}
                </div>
                {showNewMessageBanner && (
                  <div
                    onClick={() => {
                      const container = messagesContainerRef.current;
                      if (container) {
                        container.scrollTop = container.scrollHeight;
                        setShowNewMessageBanner(false);
                      }
                    }}
                    style={{
                      position: "absolute",
                      bottom: "160px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "var(--color-primary)",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>Yeni mesaj var</span>
                    <span>↓</span>
                  </div>
                )}
                <form className="support-reply-form" onSubmit={(e) => void sendReply(e)}>
                  {error ? <p style={{ margin: 0, color: "var(--color-danger)", fontSize: "0.88rem", fontWeight: 600 }}>{error}</p> : null}
                  <textarea rows={3} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Bir mesaj yazın..." disabled={isSending} />
                  <Button type="submit" disabled={isSending}>{isSending ? "Gönderiliyor..." : "Mesaj Gönder"}</Button>
                </form>
              </>
            ) : (
              <div className="thread-empty-state">
                <span className="thread-empty-state__icon" aria-hidden="true">
                  <Icon name="headset" />
                </span>
                <p>Bir destek talebi seçin veya oluşturun.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {showModal && (
        <div className="auth-modal" style={{ zIndex: 9999 }} role="dialog" aria-modal="true">
          <div className="auth-modal__backdrop" onClick={() => setShowModal(false)} />
          <div className="auth-modal__panel" style={{ maxWidth: "520px", width: "100%" }}>
            <div className="auth-modal__header">
              <span className="auth-modal__eyebrow">Destek Merkezi</span>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "4px 0 0 0" }}>Yeni Destek Talebi Oluştur</h2>
              <button aria-label="Kapat" className="auth-modal__close" onClick={() => setShowModal(false)} type="button">×</button>
            </div>
            <form className="support-request-form" onSubmit={createTicket} style={{ marginTop: "16px", display: "grid", gap: "14px" }}>
              <label className="form-field">
                <span>Talep Konusu</span>
                <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Talebinizin konusunu kısaca yazın" />
              </label>

              <label className="form-field">
                <span>Mesajınız</span>
                <textarea rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Yaşadığınız durumu veya sorunuzu detaylıca yazın..." />
              </label>

              {error ? <p className="form-error" style={{ margin: 0, color: "var(--color-danger)" }}>{error}</p> : null}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>İptal</Button>
                <Button type="submit">Talebi Gönder</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
