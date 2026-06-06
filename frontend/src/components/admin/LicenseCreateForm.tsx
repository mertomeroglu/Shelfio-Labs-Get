"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createAdminLicense,
  getAdminCustomers,
  type AdminCustomer,
  type AdminLicense,
} from "@/services/adminService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type CreateMode = "customer" | "manual";
type LicenseType = "standard" | "demo" | "enterprise";

const planFeaturesSummary: Record<string, string[]> = {
  "Demo": [
    "Dashboard", "Ürünler", "Kategoriler", "Nasıl Kullanılır", "Personel Yönetimi", "Ayarlar", "POS / Kasa", "Stok İşlemleri", "Rol Yönetimi"
  ],
  "Başlangıç": [
    "Dashboard", "Ürünler", "Kategoriler", "Nasıl Kullanılır", "Personel Yönetimi", "Ayarlar", "POS / Kasa", "Stok İşlemleri", "Rol Yönetimi", "Eşleşmeler", "Tedarikçiler", "Bildirimler"
  ],
  "Profesyonel": [
    "Dashboard", "Ürünler", "Kategoriler", "Nasıl Kullanılır", "Personel Yönetimi", "Ayarlar", "POS / Kasa", "Stok İşlemleri", "Rol Yönetimi", "Eşleşmeler", "Tedarikçiler", "Bildirimler", "Lokasyon Yönetimi", "SKT Takibi", "Depo Transfer Talepleri", "Görev Planlama", "Raporlar", "Sipariş Önerileri", "Sipariş Takibi", "Sipariş Oluştur", "Tedarikçi Ürünleri"
  ],
  "Kurumsal": [
    "Dashboard", "Ürünler", "Kategoriler", "Nasıl Kullanılır", "Personel Yönetimi", "Ayarlar", "POS / Kasa", "Stok İşlemleri", "Rol Yönetimi", "Eşleşmeler", "Tedarikçiler", "Bildirimler", "Lokasyon Yönetimi", "SKT Takibi", "Depo Transfer Talepleri", "Görev Planlama", "Raporlar", "Sipariş Önerileri", "Sipariş Takibi", "Sipariş Oluştur", "Tedarikçi Ürünleri", "Taleplerim", "Erişim Talepleri", "Fiyat & Talep Analizi", "Kampanya Yönetimi", "Proximity Yönetimi", "Etiket Yönetimi", "Müşteri Yönetimi", "Müşteri Mobil", "Personel Mobil"
  ]
};

export function LicenseCreateForm() {
  const [mode, setMode] = useState<CreateMode>("customer");
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [licenseType, setLicenseType] = useState<LicenseType>("standard");
  const [planName, setPlanName] = useState("Profesyonel");
  const [storeLimit, setStoreLimit] = useState(3);
  const [userLimit, setUserLimit] = useState(25);
  const [validity, setValidity] = useState("12 ay");
  const [submitting, setSubmitting] = useState(false);
  const [createdLicense, setCreatedLicense] = useState<AdminLicense | null>(null);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [error, setError] = useState("");
  const selectedFeatures = planFeaturesSummary[planName] ?? [];
  const previewFeatures = selectedFeatures.slice(0, 6);
  const hiddenFeatureCount = Math.max(0, selectedFeatures.length - previewFeatures.length);

  useEffect(() => {
    void getAdminCustomers()
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, []);

  function resetCustomerFields() {
    setSelectedCustomerId("");
    setCustomerName("");
    setCustomerEmail("");
    setBusinessName("");
  }

  function changeMode(nextMode: CreateMode) {
    setMode(nextMode);
    setCreatedLicense(null);
    setError("");
    resetCustomerFields();
  }

  function selectCustomer(id: string) {
    setSelectedCustomerId(id);
    const customer = customers.find((item) => item.id === id);
    setCustomerName(customer?.name ?? "");
    setCustomerEmail(customer?.email ?? "");
    setBusinessName(customer?.name ?? "");
  }

  function changeLicenseType(nextType: LicenseType) {
    setLicenseType(nextType);
    if (nextType === "demo") {
      setPlanName("Demo");
      setStoreLimit(1);
      setUserLimit(5);
      setValidity("7 gün");
    } else if (planName === "Demo") {
      setPlanName("Profesyonel");
      setStoreLimit(3);
      setUserLimit(25);
      setValidity("12 ay");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreatedLicense(null);

    if (mode === "customer" && !selectedCustomerId) {
      setError("Lütfen lisans üretilecek müşteriyi seçin.");
      return;
    }
    if (!customerName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || !planName.trim()) {
      setError("Müşteri adı, geçerli e-posta ve plan adı zorunludur.");
      return;
    }

    setSubmitting(true);
    try {
      const license = await createAdminLicense({
        businessName: businessName.trim() || customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        licenseType,
        planName,
        storeLimit,
        userLimit,
        validity,
      });
      setCreatedLicense(license);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Lisans oluşturulamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="admin-license-create-card" style={{ padding: "30px", border: "1px solid var(--color-border)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)", borderRadius: "16px" }}>
      <div className="admin-license-mode-tabs" role="tablist" aria-label="Lisans üretim tipi" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--color-surface-soft)", padding: "4px", borderRadius: "10px", border: "1px solid var(--color-border)", marginBottom: "28px" }}>
        <button aria-selected={mode === "customer"} className={mode === "customer" ? "is-active" : undefined} onClick={() => changeMode("customer")} role="tab" type="button" style={{ padding: "12px", fontWeight: 700, borderRadius: "8px", fontSize: "0.92rem" }}>
          Müşteriye Lisans Üret
        </button>
        <button aria-selected={mode === "manual"} className={mode === "manual" ? "is-active" : undefined} onClick={() => changeMode("manual")} role="tab" type="button" style={{ padding: "12px", fontWeight: 700, borderRadius: "8px", fontSize: "0.92rem" }}>
          Manuel Lisans Üret
        </button>
      </div>

      <form className="admin-license-form" onSubmit={handleSubmit} style={{ display: "grid", gap: "28px" }}>
        <div className="admin-license-form__intro" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text-strong)", margin: "0 0 6px 0" }}>
            {mode === "customer" ? "Kayıtlı Müşteriye Lisans Oluştur" : "Manuel Müşteri Bilgileriyle Lisans Oluştur"}
          </h2>
          <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.92rem", lineHeight: 1.5 }}>
            {mode === "customer" 
              ? "Kayıtlı bir müşteri seçin, plan bilgilerini doğrulayın ve lisansı tek adımda oluşturun." 
              : "Kayıtlı olmayan yeni bir müşteri için temel bilgileri girerek lisans oluşturun."}
          </p>
        </div>

        {/* SECTION 1: MÜŞTERİ BİLGİLERİ */}
        <div style={{
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "28px",
          display: "grid",
          gap: "18px"
        }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-strong)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <span style={{
              background: "var(--color-primary)",
              color: "#ffffff",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700
            }}>1</span>
            Müşteri Seçimi & Bilgileri
          </h3>
          
          {mode === "customer" ? (
            <div style={{ display: "grid", gap: "16px" }}>
              <label className="form-field">
                <span>Müşteri seç</span>
                <select onChange={(event) => selectCustomer(event.target.value)} value={selectedCustomerId} style={{ width: "100%" }}>
                  <option value="">Müşteri seçin</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name} - {customer.email}</option>
                  ))}
                </select>
              </label>

              {selectedCustomerId && (
                <div style={{
                  background: "rgba(37, 99, 235, 0.03)",
                  border: "1px solid rgba(37, 99, 235, 0.12)",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  alignItems: "center"
                }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Yetkili Müşteri</span>
                    <strong style={{ fontSize: "0.92rem", color: "var(--color-text-strong)" }}>{customerName}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>E-posta Adresi</span>
                    <strong style={{ fontSize: "0.92rem", color: "var(--color-text-strong)" }}>{customerEmail}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>İşletme Adı</span>
                    <strong style={{ fontSize: "0.92rem", color: "var(--color-text-strong)" }}>{businessName || "-"}</strong>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <Field label="Müşteri adı" onChange={setCustomerName} value={customerName} />
              <Field label="Müşteri e-posta" onChange={setCustomerEmail} type="email" value={customerEmail} />
              <Field label="İşletme adı" onChange={setBusinessName} required={false} value={businessName} />
            </div>
          )}
        </div>

        {/* SECTION 2: LİSANS YAPILANDIRMASI */}
        <div style={{
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "28px",
          display: "grid",
          gap: "18px"
        }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-strong)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <span style={{
              background: "var(--color-primary)",
              color: "#ffffff",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700
            }}>2</span>
            Lisans Yapılandırması & Limitler
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <label className="form-field">
              <span>Lisans tipi</span>
              <select onChange={(event) => changeLicenseType(event.target.value as LicenseType)} value={licenseType}>
                <option value="standard">Standart</option>
                <option value="demo">Demo</option>
                <option value="enterprise">Kurumsal / Özel</option>
              </select>
            </label>

            <label className="form-field">
              <span>Plan</span>
              <select disabled={licenseType === "demo"} onChange={(event) => setPlanName(event.target.value)} value={planName}>
                <option>Demo</option>
                <option>Başlangıç</option>
                <option>Profesyonel</option>
                <option>Kurumsal</option>
              </select>
            </label>

            <label className="form-field">
              <span>Geçerlilik süresi</span>
              <select disabled={licenseType === "demo"} onChange={(event) => setValidity(event.target.value)} value={validity}>
                <option value="7 gün">7 gün</option>
                <option value="3 ay">3 ay</option>
                <option value="6 ay">6 ay</option>
                <option value="12 ay">12 ay</option>
                <option value="24 ay">24 ay</option>
                <option value="unlimited">Süresiz</option>
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field disabled={licenseType === "demo"} label="Mağaza limiti" onChange={(value) => setStoreLimit(Number(value))} type="number" value={String(storeLimit)} />
            <Field disabled={licenseType === "demo"} label="Kullanıcı limiti" onChange={(value) => setUserLimit(Number(value))} type="number" value={String(userLimit)} />
          </div>
        </div>

        {/* SECTION 3: ERİŞİM VE ÖZELLİKLER */}
        <div style={{ display: "grid", gap: "18px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-strong)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <span style={{
              background: "var(--color-primary)",
              color: "#ffffff",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700
            }}>3</span>
            Açık Sayfalar / Özellikler ({planFeaturesSummary[planName]?.length ?? 0})
          </h3>
          
          <div style={{
            background: "var(--color-surface-soft)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "18px",
            display: "grid",
            gap: "12px"
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {previewFeatures.map((feature) => (
                <span
                  key={feature}
                  style={{
                    background: "rgba(37, 99, 235, 0.05)",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(37, 99, 235, 0.15)",
                    borderRadius: "999px",
                    padding: "6px 12px",
                    fontSize: "0.78rem",
                    fontWeight: 650,
                    display: "inline-flex",
                    alignItems: "center"
                  }}
                >
                  {feature}
                </span>
              ))}
              {hiddenFeatureCount > 0 ? (
                <button
                  className="admin-license-feature-more"
                  onClick={() => setFeatureModalOpen(true)}
                  type="button"
                  style={{
                    background: "var(--color-primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "999px",
                    padding: "6px 14px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "opacity 0.2s"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  +{hiddenFeatureCount} özellik daha gör
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {error ? <p className="form-alert">{error}</p> : null}
        {createdLicense ? (
          <div className="admin-license-success" style={{ marginTop: "12px" }}>
            <div>
              <span className="success-badge">Lisans oluşturuldu</span>
              <h3>{createdLicense.planName} lisansı hazır</h3>
              <p>Anahtar yalnızca bu oluşturma anında tam gösterilir. Güvenli biçimde paylaşın.</p>
            </div>
            <code>{createdLicense.fullKey ?? createdLicense.maskedKey}</code>
            
            {createdLicense.mailSent ? (
              <div className="admin-license-success__meta">
                <span>Müşteri: <strong>{createdLicense.customerEmail}</strong></span>
                <span>E-posta bildirimi gönderildi.</span>
              </div>
            ) : (
              <>
                <div className="admin-license-success__meta">
                  <span>Müşteri: <strong>{createdLicense.customerEmail}</strong></span>
                </div>
                <div style={{
                  padding: "12px",
                  backgroundColor: "rgba(220, 38, 38, 0.08)",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                  borderRadius: "8px",
                  color: "var(--color-danger)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "4px",
                  marginBottom: "4px"
                }}>
                  <span>⚠️ Müşteriye bildirim e-postası gönderilemedi. Lütfen lisans anahtarını kopyalayıp manuel olarak iletin.</span>
                </div>
              </>
            )}

            <Button disabled={!createdLicense.fullKey} onClick={() => createdLicense.fullKey ? void navigator.clipboard.writeText(createdLicense.fullKey) : undefined} size="sm" type="button">
              Lisans Anahtarını Kopyala
            </Button>
          </div>
        ) : null}

        <div className="admin-license-form__actions" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
          <Button disabled={submitting} type="submit" size="lg">
            {submitting ? "Lisans oluşturuluyor..." : "Lisans Oluştur"}
          </Button>
        </div>
      </form>

      {featureModalOpen ? (
        <div aria-labelledby="license-features-title" aria-modal="true" className="admin-drawer" role="dialog">
          <button aria-label="Özellik listesini kapat" className="admin-drawer__backdrop" onClick={() => setFeatureModalOpen(false)} type="button" />
          <aside className="admin-drawer__panel">
            <div className="admin-drawer__header">
              <div><span>Plan kapsamı</span><h2 id="license-features-title">{planName} özellikleri</h2></div>
              <button aria-label="Kapat" className="admin-drawer__close" onClick={() => setFeatureModalOpen(false)} type="button">×</button>
            </div>
            <div className="admin-drawer__content">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: "8px" }}>
                {selectedFeatures.map((feature) => (
                  <span
                    key={feature}
                    style={{
                      background: "rgba(37, 99, 235, 0.05)",
                      color: "var(--color-primary)",
                      border: "1px solid rgba(37, 99, 235, 0.15)",
                      borderRadius: "999px",
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center"
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </Card>
  );
}

function Field({
  disabled = false,
  label,
  onChange,
  required = true,
  type = "text",
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="form-field">
      <span>{label}{required ? null : " (opsiyonel)"}</span>
      <input disabled={disabled} onChange={(event) => onChange(event.target.value)} type={type} value={value} />
    </label>
  );
}
