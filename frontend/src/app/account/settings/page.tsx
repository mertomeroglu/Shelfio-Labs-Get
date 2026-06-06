"use client";

import { useEffect, useState } from "react";
import type { CurrentUser } from "@/types/tenant";
import { getCurrentUser } from "@/services/authService";
import { AccountPageHeader } from "@/components/account/AccountUi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AccountSettingsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  
  // Form Values
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Unsaved state management
  const [initialState, setInitialState] = useState({
    billingName: "",
    billingEmail: "",
    billingAddress: "",
    emailNotifications: true
  });

  const [showSuccess, setShowSuccess] = useState(false);

  // Credit Cards List fetched from backend
  const [cards, setCards] = useState<{ id: string; holder: string; number: string; expiry: string; cvc?: string; isDefault: boolean }[]>([]);

  const [showCardsListModal, setShowCardsListModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [modalHolder, setModalHolder] = useState("");
  const [modalNumber, setModalNumber] = useState("");
  const [modalExpiry, setModalExpiry] = useState("");
  const [modalCvc, setModalCvc] = useState("");
  const [modalError, setModalError] = useState("");

  const defaultCard = cards.find(c => c.isDefault) || cards[0];

  useEffect(() => {
    void getCurrentUser().then((currentUser) => {
      setUser(currentUser);
    });

    // Fetch settings details
    fetch("/api/account/settings")
      .then(r => r.json())
      .then(envelope => {
        if (envelope.success && envelope.data) {
          const { billingName: bName, billingEmail: bEmail, billingAddress: bAddress } = envelope.data;
          setBillingName(bName || "");
          setBillingEmail(bEmail || "");
          setBillingAddress(bAddress || "");
          setInitialState({
            billingName: bName || "",
            billingEmail: bEmail || "",
            billingAddress: bAddress || "",
            emailNotifications: true
          });
        }
      })
      .catch(err => console.error("Error fetching settings:", err));

    // Fetch card details
    fetch("/api/account/payment-method")
      .then(r => r.json())
      .then(envelope => {
        if (envelope.success && envelope.data) {
          setCards([
            {
              id: "card-tenant",
              holder: envelope.data.holder,
              number: envelope.data.number,
              expiry: envelope.data.expiry,
              isDefault: true
            }
          ]);
        } else {
          setCards([]);
        }
      })
      .catch(err => console.error("Error fetching card details:", err));
  }, []);

  const isDirty =
    billingName !== initialState.billingName ||
    billingEmail !== initialState.billingEmail ||
    billingAddress !== initialState.billingAddress ||
    emailNotifications !== initialState.emailNotifications;

  function handleSaveSettings() {
    fetch("/api/account/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billingName, billingEmail, billingAddress })
    })
      .then(r => r.json())
      .then(envelope => {
        if (envelope.success) {
          setInitialState({
            billingName,
            billingEmail,
            billingAddress,
            emailNotifications
          });
          setShowSuccess(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => setShowSuccess(false), 4000);
        }
      })
      .catch(err => console.error("Error saving settings:", err));
  }

  function handleCancelSettings() {
    setBillingName(initialState.billingName);
    setBillingEmail(initialState.billingEmail);
    setBillingAddress(initialState.billingAddress);
    setEmailNotifications(initialState.emailNotifications);
  }

  function handleCardNumberChange(val: string) {
    const digits = val.replace(/\D/g, "");
    const truncated = digits.slice(0, 16);
    const formatted = truncated.replace(/(\d{4})(?=\d)/g, "$1 ");
    setModalNumber(formatted);
  }

  function handleExpiryChange(val: string) {
    let clean = val.replace(/\D/g, "");
    if (clean.length > 4) clean = clean.slice(0, 4);
    if (clean.length >= 3) {
      setModalExpiry(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setModalExpiry(clean);
    }
  }

  function handleCvcChange(val: string) {
    const clean = val.replace(/\D/g, "");
    setModalCvc(clean.slice(0, 4));
  }

  function handleSaveCard(e: React.FormEvent) {
    e.preventDefault();
    if (!modalHolder.trim() || !modalNumber.trim() || !modalExpiry.trim() || !modalCvc.trim()) {
      setModalError("Lütfen tüm alanları doldurun.");
      return;
    }

    const cleanNum = modalNumber.replace(/\s+/g, "");
    if (cleanNum.length < 15 || cleanNum.length > 16) {
      setModalError("Lütfen geçerli bir 15 veya 16 haneli kart numarası girin.");
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(modalExpiry)) {
      setModalError("Lütfen son kullanma tarihini AA/YY formatında girin.");
      return;
    }
    const [month] = modalExpiry.split("/").map(Number);
    if (month < 1 || month > 12) {
      setModalError("Lütfen geçerli bir ay girin (01-12).");
      return;
    }

    if (modalCvc.length < 3 || modalCvc.length > 4) {
      setModalError("Lütfen geçerli bir CVC kodu girin.");
      return;
    }

    fetch("/api/account/payment-method", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        holder: modalHolder.trim(),
        number: cleanNum,
        expiry: modalExpiry.trim()
      })
    })
      .then(r => r.json())
      .then(envelope => {
        if (envelope.success && envelope.data) {
          setCards([
            {
              id: "card-tenant",
              holder: envelope.data.holder,
              number: envelope.data.number,
              expiry: envelope.data.expiry,
              isDefault: true
            }
          ]);
          setShowAddCardModal(false);
          setShowSuccess(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => setShowSuccess(false), 4000);
        } else {
          setModalError(envelope.message || "Kart kaydedilemedi.");
        }
      })
      .catch(err => {
        console.error("Error saving card:", err);
        setModalError("Kart kaydedilirken bir hata oluştu.");
      });
  }
  return (
    <>
      <AccountPageHeader
        description="Hesap, faturalandırma, bildirim ve güvenlik tercihlerinizi yönetin."
        eyebrow="Müşteri Portalı"
        title="Ayarlar"
      />

      {showSuccess && (
        <div className="account-alert" style={{
          backgroundColor: "rgb(22 163 74 / 6%)",
          border: "1px solid rgb(22 163 74 / 20%)",
          color: "var(--color-success)",
          padding: "14px 20px",
          borderRadius: "8px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "0.92rem",
          fontWeight: 600
        }}>
          <span>✓</span>
          <span>Ayarlar başarıyla kaydedildi.</span>
        </div>
      )}

      <div className="account-settings-grid">
        <Card className="account-settings-card">
          <div style={{ display: "grid", gap: "12px" }}>
            <h2>Hesap bilgileri</h2>
            <dl className="settings-list">
              <div><dt>Yetkili</dt><dd>{user?.name ?? "Yükleniyor"}</dd></div>
              <div><dt>E-posta</dt><dd>{user?.email ?? "Yükleniyor"}</dd></div>
              <div><dt>İşletme</dt><dd>{user?.tenant.name ?? "Yükleniyor"}</dd></div>
            </dl>
          </div>
        </Card>

        <Card className="account-settings-card">
          <div style={{ display: "grid", gap: "12px" }}>
            <h2>Fatura bilgileri</h2>
            <div className="settings-form">
              <label className="form-field"><span>Fatura unvanı</span><input value={billingName} onChange={(event) => setBillingName(event.target.value)} /></label>
              <label className="form-field"><span>Fatura e-postası</span><input type="email" value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} /></label>
              <label className="form-field"><span>Adres</span><textarea rows={3} value={billingAddress} onChange={(event) => setBillingAddress(event.target.value)} /></label>
            </div>
          </div>
        </Card>

        <Card className="account-settings-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
          <div style={{ display: "grid", gap: "12px" }}>
            <h2>Ödeme yöntemi</h2>
            {cards.length > 0 && defaultCard ? (
              <div className="payment-method-box" style={{
                background: "var(--color-surface-soft)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }} aria-hidden="true">💳</span>
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--color-text-strong)" }}>{defaultCard.number}</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{defaultCard.holder} · SKT: {defaultCard.expiry}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowCardsListModal(true)}>Değiştir</Button>
              </div>
            ) : (
              <div style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "0.88rem",
                border: "1px dashed var(--color-border)",
                borderRadius: "12px",
                marginBottom: "16px",
                background: "var(--color-surface-soft)"
              }}>
                Kayıtlı ödeme yöntemi bulunmuyor.
              </div>
            )}
          </div>
          <Button onClick={() => {
            setModalHolder("");
            setModalNumber("");
            setModalExpiry("");
            setModalCvc("");
            setModalError("");
            setShowAddCardModal(true);
          }} style={{ width: "100%" }}>Yeni ödeme yöntemi ekle</Button>
        </Card>

        <Card className="account-settings-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
          <div style={{ display: "grid", gap: "12px" }}>
            <h2>Bildirimler ve güvenlik</h2>
            <label className="settings-toggle" style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", marginBottom: "16px" }}>
              <input checked={emailNotifications} type="checkbox" onChange={(event) => setEmailNotifications(event.target.checked)} style={{ marginTop: "3px" }} />
              <span style={{ fontSize: "0.9rem", color: "var(--color-text-body)" }}>Lisans, fatura ve destek bildirimlerini e-posta ile al</span>
            </label>
          </div>
          <Button href="/sifremi-unuttum" variant="outline" style={{ width: "100%" }}>Şifremi Değiştir</Button>
        </Card>
      </div>

      {isDirty && (
        <div className="settings-save-banner" role="alert">
          <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "#ffffff" }}>Kaydedilmemiş değişiklikler var.</span>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button size="sm" variant="outline" onClick={handleCancelSettings} style={{ borderColor: "rgba(255, 255, 255, 0.25)", color: "#ffffff", background: "transparent" }}>İptal</Button>
            <Button size="sm" onClick={handleSaveSettings} style={{ backgroundColor: "var(--color-primary)", color: "#ffffff", border: "none" }}>Değişiklikleri Kaydet</Button>
          </div>
        </div>
      )}

      {showCardsListModal && (
        <div className="auth-modal" style={{ zIndex: 9999 }} role="dialog" aria-modal="true">
          <div className="auth-modal__backdrop" onClick={() => setShowCardsListModal(false)} />
          <div className="auth-modal__panel" style={{ maxWidth: "480px", width: "100%" }}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">Ödeme Yöntemi</span>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "4px 0 0 0" }}>Kayıtlı Kartlarım</h2>
              </div>
              <button aria-label="Kapat" className="auth-modal__close" onClick={() => setShowCardsListModal(false)} type="button">×</button>
            </div>
            
            <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
              {cards.map((card) => (
                <div key={card.id} style={{
                  background: card.isDefault ? "var(--color-surface-blue)" : "var(--color-surface-soft)",
                  border: card.isDefault ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }} aria-hidden="true">💳</span>
                    <div>
                      <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--color-text-strong)" }}>
                        {card.number}
                        {card.isDefault && (
                          <Badge variant="primary" style={{ marginLeft: "8px", fontSize: "0.7rem", padding: "2px 6px" }}>Varsayılan</Badge>
                        )}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{card.holder} · SKT: {card.expiry}</span>
                    </div>
                  </div>
                  {!card.isDefault && (
                    <Button size="sm" variant="outline" onClick={() => {
                      setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === card.id })));
                      setShowSuccess(true);
                      setTimeout(() => setShowSuccess(false), 4000);
                    }}>
                      Varsayılan Yap
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <Button variant="outline" type="button" onClick={() => setShowCardsListModal(false)}>Kapat</Button>
              <Button type="button" onClick={() => {
                setShowCardsListModal(false);
                setModalHolder("");
                setModalNumber("");
                setModalExpiry("");
                setModalCvc("");
                setModalError("");
                setShowAddCardModal(true);
              }}>Yeni Kart Ekle</Button>
            </div>
          </div>
        </div>
      )}

      {showAddCardModal && (
        <div className="auth-modal" style={{ zIndex: 9999 }} role="dialog" aria-modal="true">
          <div className="auth-modal__backdrop" onClick={() => setShowAddCardModal(false)} />
          <div className="auth-modal__panel" style={{ maxWidth: "480px", width: "100%" }}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">Ödeme Yöntemi</span>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "4px 0 0 0" }}>Yeni Kart Ekle</h2>
              </div>
              <button aria-label="Kapat" className="auth-modal__close" onClick={() => setShowAddCardModal(false)} type="button">×</button>
            </div>
            <form className="support-request-form" onSubmit={handleSaveCard} style={{ marginTop: "16px", display: "grid", gap: "14px" }}>
              <label className="form-field">
                <span>Kart Sahibi</span>
                <input value={modalHolder} onChange={(e) => setModalHolder(e.target.value.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ\s]/g, ""))} placeholder="Ahmet Yılmaz" required />
              </label>

              <label className="form-field">
                <span>Kart Numarası</span>
                <input value={modalNumber} onChange={(e) => handleCardNumberChange(e.target.value)} placeholder="4111 1111 1111 1111" maxLength={19} required />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <label className="form-field">
                  <span>Son Kullanma (AA/YY)</span>
                  <input value={modalExpiry} onChange={(e) => handleExpiryChange(e.target.value)} placeholder="12/28" maxLength={5} required />
                </label>
                <label className="form-field">
                  <span>CVC / CVV</span>
                  <input value={modalCvc} onChange={(e) => handleCvcChange(e.target.value)} placeholder="123" maxLength={4} type="password" required />
                </label>
              </div>

              {modalError ? <p className="form-error" style={{ margin: 0, color: "var(--color-danger)" }}>{modalError}</p> : null}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <Button variant="outline" type="button" onClick={() => setShowAddCardModal(false)}>Vazgeç</Button>
                <Button type="submit">Kartı Kaydet</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
