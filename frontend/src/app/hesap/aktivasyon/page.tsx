"use client";

import { FormEvent, useState } from "react";
import { AccountPageHeader } from "@/components/account/AccountUi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { routes } from "@/lib/routes";
import { activateAccountLicense } from "@/services/accountService";

export default function AccountActivationPage() {
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!licenseKey.trim()) {
      setError("Lisans anahtarını girin.");
      return;
    }

    setSubmitting(true);
    try {
      await activateAccountLicense(licenseKey.trim());
      setLicenseKey("");
      setSuccess("Lisans başarıyla hesabınıza bağlandı.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Lisans aktivasyonu tamamlanamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AccountPageHeader
        description="Fiziksel veya dijital lisans anahtarınızı girerek lisansınızı müşteri hesabınıza bağlayın."
        eyebrow="Lisans Yönetimi"
        title="Lisans Aktivasyonu"
      />
      <Card className="account-activation-card">
        <div className="account-activation-card__intro">
          <h2>Lisans anahtarınızı doğrulayın</h2>
          <p>Anahtarınız güvenli biçimde doğrulanır. Lisans anahtarının tamamı müşteri panelinde saklanmaz veya gösterilmez.</p>
        </div>
        <form className="account-activation-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Fiziksel / dijital lisans anahtarı</span>
            <input autoComplete="off" onChange={(event) => setLicenseKey(event.target.value)} placeholder="SHLF-XXXX-XXXX" value={licenseKey} />
          </label>
          {error ? <p className="form-alert" role="alert">{error}</p> : null}
          {success ? <div className="account-activation-success"><strong>{success}</strong><p>Aktif lisansınızı lisanslar ekranında inceleyebilirsiniz.</p></div> : null}
          <div className="account-actions">
            <Button disabled={submitting} type="submit">{submitting ? "Doğrulanıyor..." : "Lisansı Aktive Et"}</Button>
            <Button href={routes.accountLicenses} variant="outline">Lisanslarıma Dön</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
