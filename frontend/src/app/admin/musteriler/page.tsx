"use client";

import { useEffect, useState } from "react";
import type { AdminCustomer, AdminDemoRequest } from "@/services/adminService";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getAdminCustomers, createAdminCustomer, getAdminDemoRequests } from "@/services/adminService";
import { Button } from "@/components/ui/Button";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [error, setError] = useState("");

  // Add Customer Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [demoRequests, setDemoRequests] = useState<AdminDemoRequest[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [selectedDemoId, setSelectedDemoId] = useState("");
  const [note, setNote] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (showAddModal) {
      void getAdminDemoRequests()
        .then((reqs) => {
          setDemoRequests(reqs.filter((r) => r.status === "Yeni"));
        })
        .catch(() => {});
    }
  }, [showAddModal]);

  function loadCustomers() {
    void getAdminCustomers()
      .then((nextCustomers) => {
        setCustomers(nextCustomers);
        setError("");
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Müşteri listesi alınamadı.");
      });
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!fullName.trim() || !email.trim() || !businessName.trim()) {
      setModalError("Ad soyad, e-posta ve işletme adı zorunludur.");
      return;
    }

    setSubmitting(true);
    setModalError("");
    setModalSuccess("");

    try {
      const result = await createAdminCustomer({
        fullName,
        email,
        phone: phone || undefined,
        businessName,
        demoRequestId: selectedDemoId || undefined,
        note: note || undefined,
      });

      setModalSuccess(
        result.mailSent
          ? "Müşteri oluşturuldu ve ilk şifre oluşturma bağlantısı mail ile gönderildi."
          : "Müşteri oluşturuldu fakat e-posta gönderilemedi."
      );

      // Reset fields
      setFullName("");
      setEmail("");
      setPhone("");
      setBusinessName("");
      setSelectedDemoId("");
      setNote("");

      // Reload
      loadCustomers();

      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess("");
      }, 2500);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Müşteri oluşturulurken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "8px" }}>
        <AdminPageHeader
          description="Müşteri hesaplarını, mağaza sayılarını ve aktif plan durumlarını inceleyin."
          title="Müşteriler"
        />
        <button
          className="button button--primary"
          onClick={() => {
            setModalError("");
            setModalSuccess("");
            setShowAddModal(true);
          }}
          type="button"
          style={{ marginBottom: "14px" }}
        >
          + Müşteri Ekle
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      <div className="admin-data-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Müşteri</th>
              <th>E-posta</th>
              <th>Tenant</th>
              <th>Mağaza</th>
              <th>Plan</th>
              <th>Lisans</th>
              <th>Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td><strong>{customer.name}</strong></td>
                <td><span className="admin-truncate" title={customer.email}>{customer.email}</span></td>
                <td><span className="admin-truncate admin-mono" title={customer.id}>{customer.id}</span></td>
                <td>{customer.storeCount}</td>
                <td>{customer.planName}</td>
                <td><StatusBadge active={customer.subscriptionStatus === "active"} /></td>
                <td><button className="admin-detail-button" onClick={() => setSelectedCustomer(customer)} type="button">Detay</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!customers.length ? <div className="admin-empty-state">Henüz müşteri kaydı bulunmuyor.</div> : null}
      </div>

      {/* Selected Customer Detail Drawer */}
      {selectedCustomer ? (
        <DetailDrawer onClose={() => setSelectedCustomer(null)} title="Müşteri Detayı">
          <Detail label="Müşteri adı" value={selectedCustomer.name} />
          <Detail label="E-posta" value={selectedCustomer.email} />
          <Detail label="Tenant" mono value={selectedCustomer.id} />
          <Detail label="Mağaza sayısı" value={String(selectedCustomer.storeCount)} />
          <Detail label="Plan" value={selectedCustomer.planName} />
          <div className="admin-drawer__detail">
            <span>Lisans durumu</span>
            <StatusBadge active={selectedCustomer.subscriptionStatus === "active"} />
          </div>
        </DetailDrawer>
      ) : null}

      {/* Manual Customer Creation Modal */}
      {showAddModal ? (
        <div aria-labelledby="add-customer-title" aria-modal="true" className="auth-modal" role="dialog" style={{ zIndex: 9999 }}>
          <button aria-label="Kapat" className="auth-modal__backdrop" onClick={() => !submitting && setShowAddModal(false)} type="button" />
          <div className="auth-modal__panel auth-modal__panel--compact" style={{ width: "100%" }}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">Müşteri Tanımlama</span>
                <h2 id="add-customer-title">Yeni Müşteri Ekle</h2>
                <p>Müşteri için manuel hesap ve ilk şifre aktivasyon süreci başlatın.</p>
              </div>
              <button aria-label="Kapat" className="auth-modal__close" onClick={() => !submitting && setShowAddModal(false)} type="button">
                ×
              </button>
            </div>

            <form className="login-form" onSubmit={handleAddCustomer} noValidate style={{ marginTop: "16px" }}>
              <div className="form-field">
                <label htmlFor="add-customer-demo">Demo Talebiyle İlişkilendir (Opsiyonel)</label>
                <select
                  id="add-customer-demo"
                  value={selectedDemoId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedDemoId(val);
                    if (val) {
                      const found = demoRequests.find((r) => r.id === val);
                      if (found) {
                        setFullName(found.contact.split("@")[0].toUpperCase() || "");
                        setEmail(found.contact || "");
                        setBusinessName(found.company || "");
                      }
                    }
                  }}
                  disabled={submitting}
                >
                  <option value="">İlişkilendirme yok (Bağımsız kayıt)</option>
                  {demoRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.company} ({r.contact})
                    </option>
                  ))}
                </select>
              </div>

              <div className="login-form__grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px", marginTop: "4px" }}>
                <div className="form-field">
                  <label htmlFor="add-customer-fullname">Ad Soyad</label>
                  <input
                    id="add-customer-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={submitting}
                    placeholder="Örn. Ahmet Yılmaz"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="add-customer-email">E-posta</label>
                  <input
                    id="add-customer-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={submitting}
                    placeholder="orn@isletme.com"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="add-customer-phone">Telefon (Opsiyonel)</label>
                  <input
                    id="add-customer-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    placeholder="05..."
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="add-customer-business">İşletme Adı</label>
                  <input
                    id="add-customer-business"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    disabled={submitting}
                    placeholder="İşletme Ltd."
                  />
                </div>
              </div>



              {modalError ? <p className="form-error" aria-live="polite">{modalError}</p> : null}
              {modalSuccess ? <p className="form-success" aria-live="polite">{modalSuccess}</p> : null}

              <Button disabled={submitting} size="lg" type="submit" style={{ marginTop: "8px" }}>
                {submitting ? "Müşteri Oluşturuluyor..." : "Müşteri Oluştur"}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`admin-status-badge ${active ? "is-active" : "is-inactive"}`}>{active ? "Aktif" : "Pasif"}</span>;
}

function Detail({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return <div className="admin-drawer__detail"><span>{label}</span><strong className={mono ? "admin-mono" : undefined}>{value}</strong></div>;
}

function DetailDrawer({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div aria-labelledby="customer-drawer-title" aria-modal="true" className="admin-drawer" role="dialog">
      <button aria-label="Detay penceresini kapat" className="admin-drawer__backdrop" onClick={onClose} type="button" />
      <aside className="admin-drawer__panel">
        <div className="admin-drawer__header">
          <div><span>Müşteri yönetimi</span><h2 id="customer-drawer-title">{title}</h2></div>
          <button aria-label="Kapat" className="admin-drawer__close" onClick={onClose} type="button">×</button>
        </div>
        <div className="admin-drawer__content">{children}</div>
      </aside>
    </div>
  );
}

