"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  getAdminSupportTicket,
  getAdminSupportTickets,
  sendAdminSupportMessage,
  type AdminSupportTicket,
  type AdminSupportTicketDetail,
  updateAdminSupportStatus,
} from "@/services/adminService";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

const statuses: AdminSupportTicket["status"][] = ["Yeni", "Yanıt bekliyor", "Yanıtlandı", "Çözüldü"];

const SUPPORT_POLL_INTERVAL_MS = 7000;

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [selected, setSelected] = useState<AdminSupportTicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  const sendingRef = useRef(false);
  const isPollingRef = useRef(false);
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
    const isOwnMessage = lastMessage.author === "admin";
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
      const nextTickets = await getAdminSupportTickets();
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
      const nextSelected = await getAdminSupportTicket(selectedId);
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
      if (!sendingRef.current) {
        await refreshSelectedTicket(options);
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [refreshSelectedTicket, refreshTickets]);

  useEffect(() => {
    let cancelled = false;

    void getAdminSupportTickets()
      .then(async (nextTickets) => {
        if (cancelled) return;
        setTickets(nextTickets);
        if (nextTickets[0]) {
          selectedIdRef.current = nextTickets[0].id;
          const nextSelected = await getAdminSupportTicket(nextTickets[0].id);
          if (!cancelled) setSelected(nextSelected);
        }
      })
      .catch(() => setError("Destek talepleri alınamadı."));
    return () => {
      cancelled = true;
    };
  }, []);

  // scrollIntoView logic removed and replaced with container scrollTop

  useEffect(() => {
    selectedIdRef.current = selected?.id ?? null;
  }, [selected?.id]);

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

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
    setError("");
    try {
      selectedIdRef.current = id;
      setSelected(await getAdminSupportTicket(id));
    } catch {
      setError("Destek talebi detayı alınamadı.");
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !reply.trim() || sending) return;

    const messageText = reply.trim();
    setReply("");
    setSending(true);
    setError("");

    try {
      const updated = await sendAdminSupportMessage(selected.id, messageText);
      selectedIdRef.current = updated.id;
      setSelected(updated);
      await refreshTickets({ silent: true });
      await refreshSelectedTicket({ silent: true });
    } catch {
      setReply(messageText);
      setError("Yanıt gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status: AdminSupportTicket["status"]) {
    if (!selected) return;
    setError("");
    try {
      const updated = await updateAdminSupportStatus(selected.id, status);
      selectedIdRef.current = updated.id;
      setSelected(updated);
      await refreshTickets({ silent: true });
      await refreshSelectedTicket({ silent: true });
    } catch {
      setError("Talep durumu güncellenemedi.");
    }
  }

  const sortedTickets = [...tickets].sort((a, b) => {
    const score = (status: string) => {
      if (status === "Yeni" || status === "Yanıt bekliyor") return 1;
      if (status === "Yanıtlandı") return 2;
      if (status === "Çözüldü") return 3;
      return 4;
    };
    return score(a.status) - score(b.status);
  });

  const filteredTickets = sortedTickets.filter((ticket) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      String(ticket.id).toLowerCase().includes(query) ||
      (ticket.shortReference ? String(ticket.shortReference).toLowerCase().includes(query) : false) ||
      String(ticket.customerName).toLowerCase().includes(query) ||
      String(ticket.customerEmail).toLowerCase().includes(query) ||
      String(ticket.subject).toLowerCase().includes(query)
    );
  });

  const getTicketClass = (ticket: AdminSupportTicket) => {
    const classes = [];
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
      <AdminPageHeader
        description="Müşteri destek taleplerini inceleyin, mesaj geçmişini takip edin ve yanıt süreçlerini yönetin."
        title="Destek Talepleri"
      />
      {error ? <p className="form-alert">{error}</p> : null}
      <div className="admin-support-layout">
        {/* ── Sidebar ── */}
        <section className="admin-support-sidebar">
          <div className="admin-support-section-heading">
            <div>
              <span>Destek kuyruğu</span>
              <h2>Gelen Talepler</h2>
            </div>
            <strong>{filteredTickets.length}</strong>
          </div>

          <div className="admin-support-search">
            <Icon name="search" className="admin-support-search__icon" />
            <input
              type="text"
              placeholder="Talep ID, müşteri adı veya e-posta ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="admin-support-ticket-list">
            {filteredTickets.map((ticket) => (
              <button className={getTicketClass(ticket)} key={ticket.id} onClick={() => void selectTicket(ticket.id)} type="button">
                <div className="admin-support-ticket__topline">
                  <strong>#{ticket.shortReference || ticket.id.slice(0, 5)} · {ticket.subject}</strong>
                  <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
                </div>
                <span>{ticket.customerName}</span>
                <small>{ticket.customerEmail} · {ticket.updatedAt}</small>
                <div className="admin-support-ticket__meta">
                  <Badge>{ticket.source === "public" ? "Public" : "Portal"}</Badge>
                  <Badge>{ticket.module}</Badge>
                </div>
              </button>
            ))}
            {!filteredTickets.length ? (
              <div className="admin-support-empty">
                <strong>Arama sonucu bulunamadı.</strong>
                <p>Kriterlere uygun aktif bir destek talebi mevcut değil.</p>
              </div>
            ) : null}
          </div>
        </section>

        {/* ── Detail ── */}
        <Card className="admin-support-detail" padding="lg" style={{ position: "relative" }}>
          {selected ? (
            <>
              {/* Header */}
              <div className="admin-support-detail__header">
                <div>
                  <span>Talep #{selected.shortReference || selected.id.slice(0, 5)}</span>
                  <h2>{selected.subject}</h2>
                </div>
                <label className="admin-support-status">
                  <span>Durum</span>
                  <select value={selected.status} onChange={(event) => void changeStatus(event.target.value as AdminSupportTicket["status"])}>
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
              </div>

              {/* Customer info */}
              <div className="admin-support-customer-grid">
                <div>
                  <span>Müşteri</span>
                  <strong>{selected.customerName}</strong>
                </div>
                <div>
                  <span>E-posta</span>
                  <strong>{selected.customerEmail}</strong>
                </div>
                <div>
                  <span>Modül</span>
                  <strong>{selected.module}</strong>
                </div>
                <div>
                  <span>Kaynak</span>
                  <strong>{selected.source === "public" ? "Public (Girişsiz)" : "Müşteri Portalı"}</strong>
                </div>
              </div>

              {/* Messages */}
              <section className="admin-support-history">
                <div className="admin-support-section-heading">
                  <div>
                    <span>Konuşma</span>
                    <h2>Mesaj Geçmişi</h2>
                  </div>
                </div>

                <div className="admin-support-messages" ref={messagesContainerRef}>
                  {selected.messages.map((message) => (
                    <div className={`admin-support-message admin-support-message--${message.author}`} key={message.id}>
                      <div className="admin-support-message__header">
                        <span className="admin-support-message__author">
                          {message.author === "admin" ? (
                            <><Icon name="shield" className="admin-support-message__avatar admin-support-message__avatar--admin" /> Admin</>
                          ) : (
                            <><Icon name="user" className="admin-support-message__avatar admin-support-message__avatar--customer" /> {selected.customerName}</>
                          )}
                        </span>
                        <span className="admin-support-message__time">{message.createdAt}</span>
                      </div>
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
              </section>

              {/* Reply form */}
              <form className="admin-support-reply" onSubmit={(e) => void sendReply(e)}>
                <label>
                  <span>Müşteriye yanıt</span>
                  <textarea onChange={(event) => setReply(event.target.value)} placeholder="Yanıtınızı yazın..." rows={4} value={reply} disabled={sending} />
                </label>
                <Button disabled={sending || !reply.trim()} type="submit">
                  {sending ? "Gönderiliyor..." : "Yanıt Gönder"}
                </Button>
              </form>
            </>
          ) : (
            <div className="admin-support-empty admin-support-empty--detail">
              <Icon name="headset" className="admin-support-empty__icon" />
              <strong>İncelemek için bir destek talebi seçin.</strong>
              <p>Müşteri bilgileri, mesaj geçmişi ve yanıt alanı burada gösterilecek.</p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function statusVariant(status: AdminSupportTicket["status"]) {
  if (status === "Çözüldü") return "success";
  if (status === "Yanıtlandı") return "primary";
  if (status === "Yeni") return "danger";
  return "warning";
}
