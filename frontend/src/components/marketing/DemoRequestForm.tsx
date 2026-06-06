"use client";

import { FormEvent, useState } from "react";
import { BusinessType, DemoRequestPayload, requestDemo } from "@/services/checkoutService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  storeCount: string;
  businessType: BusinessType | "";
  message: string;
  consentAccepted: boolean;
  website: string;
};

type FormErrors = Partial<Record<keyof FormState | "service", string>>;

const businessTypes: BusinessType[] = ["Market", "Mini market", "Zincir mağaza", "Depolu satış noktası", "Diğer"];

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  companyName: "",
  storeCount: "",
  businessType: "",
  message: "",
  consentAccepted: false,
  website: "",
};

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(values: FormState): FormErrors {
  const errors: FormErrors = {};
  const storeCount = Number(values.storeCount);
  if (!values.fullName.trim()) errors.fullName = "Ad soyad zorunludur.";
  if (!values.email.trim()) errors.email = "E-posta zorunludur.";
  else if (!validateEmail(values.email)) errors.email = "Geçerli bir e-posta adresi yazın.";
  if (!values.companyName.trim()) errors.companyName = "İşletme adı zorunludur.";
  if (!values.storeCount.trim()) errors.storeCount = "Mağaza sayısı zorunludur.";
  else if (!Number.isInteger(storeCount) || storeCount < 1) errors.storeCount = "Mağaza sayısı 1 veya daha büyük bir tam sayı olmalıdır.";
  if (!values.consentAccepted) errors.consentAccepted = "Devam etmek için iletişim onayını işaretleyin.";
  return errors;
}

export function DemoRequestForm() {
  const [values, setValues] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSuccessMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    const payload: DemoRequestPayload = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || undefined,
      companyName: values.companyName.trim(),
      storeCount: Number(values.storeCount),
      businessType: values.businessType || undefined,
      interestedModules: [],
      message: values.message.trim() || undefined,
      consentAccepted: values.consentAccepted,
      website: values.website,
    };

    try {
      await requestDemo(payload);
      setSuccessMessage("Demo talebiniz alındı. Ekibimiz sizinle iletişime geçecektir.");
      setValues(initialState);
    } catch {
      setSuccessMessage(null);
      setErrors({ service: "Talebiniz gönderilemedi. Lütfen bilgileri kontrol edip tekrar deneyin." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="demo-form-card" padding="lg">
      <form className="demo-form" onSubmit={handleSubmit} noValidate>
        <label className="demo-honeypot" aria-hidden="true">
          <span>Web sitesi</span>
          <input autoComplete="off" tabIndex={-1} value={values.website} onChange={(event) => updateField("website", event.target.value)} />
        </label>
        <div className="demo-form__grid">
          <Field error={errors.fullName} id="demo-full-name" label="Ad soyad *" value={values.fullName} onChange={(value) => updateField("fullName", value)} autoComplete="name" />
          <Field error={errors.email} id="demo-email" label="E-posta *" value={values.email} onChange={(value) => updateField("email", value)} autoComplete="email" type="email" />
          <Field id="demo-phone" label="Telefon" value={values.phone} onChange={(value) => updateField("phone", value)} autoComplete="tel" />
          <Field error={errors.companyName} id="demo-company-name" label="İşletme adı *" value={values.companyName} onChange={(value) => updateField("companyName", value)} autoComplete="organization" />
          <Field error={errors.storeCount} id="demo-store-count" label="Mağaza sayısı *" value={values.storeCount} onChange={(value) => updateField("storeCount", value)} type="number" />
          <label className="form-field">
            <span>İşletme tipi</span>
            <select id="demo-business-type" value={values.businessType} onChange={(event) => updateField("businessType", event.target.value as BusinessType | "")}>
              <option value="">Seçiniz</option>
              {businessTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
        </div>

        <label className="form-field">
          <span>Mesaj</span>
          <textarea id="demo-message" rows={5} value={values.message} onChange={(event) => updateField("message", event.target.value)} />
        </label>

        <label className="consent-field">
          <input checked={values.consentAccepted} id="demo-consent" type="checkbox" onChange={(event) => updateField("consentAccepted", event.target.checked)} />
          <span>
            Demo talebimle ilgili benimle iletişime geçilmesini ve paylaştığım bilgilerin bu amaçla
            işlenmesini kabul ediyorum. <a href="/yasal/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a>
          </span>
        </label>
        {errors.consentAccepted ? <small className="form-error" id="demo-consent-error" role="alert">{errors.consentAccepted}</small> : null}
        {successMessage ? <p className="form-success">{successMessage}</p> : null}
        {errors.service ? <p className="form-error" role="alert">{errors.service}</p> : null}
        <Button disabled={isSubmitting} size="lg" type="submit">{isSubmitting ? "Gönderiliyor" : "Demo Talebini Gönder"}</Button>
      </form>
    </Card>
  );
}

function Field({
  autoComplete,
  error,
  id,
  label,
  onChange,
  type = "text",
  value,
}: {
  autoComplete?: string;
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <small id={`${id}-error`} role="alert">{error}</small> : null}
    </label>
  );
}
