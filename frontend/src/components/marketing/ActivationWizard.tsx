"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type { BusinessType } from "@/services/checkoutService";
import {
  activateLicense,
  getShelfioRedirectUrl,
  validateLicenseKey,
} from "@/services/licenseService";
import type {
  LicenseActivationResult,
  LicensePlan,
  LicenseValidationPayload,
  LicenseValidationResult,
} from "@/types/license";
import type { OwnerAccountInfo, StoreActivationInfo, TenantActivationInfo } from "@/types/tenant";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Step = 0 | 1 | 2 | 3 | 4;

type ActivationState = {
  licenseKey: string;
  ownerEmail: string;
  businessName: string;
  storeName: string;
  storeType: BusinessType | "";
  city: string;
  district: string;
  storePhone: string;
  storeCount: string;
  ownerFullName: string;
  accountEmail: string;
  ownerPhone: string;
  password: string;
  passwordRepeat: string;
  termsAccepted: boolean;
};

type ActivationErrors = Partial<Record<keyof ActivationState | "service", string>>;

const steps = ["Lisans Bilgisi", "Mağaza Bilgisi", "Yetkili Hesap", "Onay", "Tamamlandı"] as const;
const storeTypes: BusinessType[] = ["Market", "Mini market", "Zincir mağaza", "Depolu satış noktası", "Diğer"];
const activationErrorMessage =
  "Lisans akışı şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.";
const validationErrorMessage =
  "Lisans kontrolü şu anda yapılamadı. Lütfen daha sonra tekrar deneyin.";

const initialState: ActivationState = {
  licenseKey: "",
  ownerEmail: "",
  businessName: "",
  storeName: "",
  storeType: "",
  city: "",
  district: "",
  storePhone: "",
  storeCount: "",
  ownerFullName: "",
  accountEmail: "",
  ownerPhone: "",
  password: "",
  passwordRepeat: "",
  termsAccepted: false,
};

function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ActivationWizard() {
  const [step, setStep] = useState<Step>(0);
  const [values, setValues] = useState<ActivationState>(initialState);
  const [errors, setErrors] = useState<ActivationErrors>({});
  const [plan, setPlan] = useState<LicensePlan | null>(null);
  const [result, setResult] = useState<LicenseActivationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof ActivationState>(field: K, value: ActivationState[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, service: undefined }));
  }

  function validateStep(currentStep: Step): ActivationErrors {
    const nextErrors: ActivationErrors = {};

    if (currentStep === 0) {
      if (!values.licenseKey.trim()) nextErrors.licenseKey = "Lisans anahtarı zorunludur.";
      if (!values.ownerEmail.trim()) nextErrors.ownerEmail = "Lisans sahibi e-posta zorunludur.";
      else if (!isEmail(values.ownerEmail)) nextErrors.ownerEmail = "Geçerli bir e-posta yazın.";
    }

    if (currentStep === 1) {
      if (!values.businessName.trim()) nextErrors.businessName = "İşletme adı zorunludur.";
      if (!values.storeName.trim()) nextErrors.storeName = "Mağaza adı zorunludur.";
      if (!values.storeType) nextErrors.storeType = "Mağaza tipi seçin.";
      if (!values.city.trim()) nextErrors.city = "Şehir zorunludur.";
      if (!values.district.trim()) nextErrors.district = "İlçe zorunludur.";
      if (!values.storeCount.trim()) nextErrors.storeCount = "Mağaza sayısı zorunludur.";
      else if (!Number.isInteger(Number(values.storeCount)) || Number(values.storeCount) < 1) {
        nextErrors.storeCount = "Mağaza sayısı 1 veya daha büyük olmalıdır.";
      }
    }

    if (currentStep === 2) {
      if (!values.ownerFullName.trim()) nextErrors.ownerFullName = "Yetkili adı soyadı zorunludur.";
      if (!values.accountEmail.trim()) nextErrors.accountEmail = "Yetkili e-posta zorunludur.";
      else if (!isEmail(values.accountEmail)) nextErrors.accountEmail = "Geçerli bir e-posta yazın.";
      if (values.password.length < 8) nextErrors.password = "Şifre en az 8 karakter olmalıdır.";
      if (values.passwordRepeat !== values.password) nextErrors.passwordRepeat = "Şifreler eşleşmiyor.";
      if (!values.termsAccepted) nextErrors.termsAccepted = "KVKK ve kullanım şartları onayı zorunludur.";
    }

    return nextErrors;
  }

  async function handleNext() {
    const nextErrors = validateStep(step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (step === 0) {
      setIsSubmitting(true);
      const payload: LicenseValidationPayload = {
        licenseKey: values.licenseKey,
        ownerEmail: values.ownerEmail,
      };
      let validation: LicenseValidationResult;
      try {
        validation = await validateLicenseKey(payload);
      } catch {
        setIsSubmitting(false);
        setErrors({ service: validationErrorMessage });
        return;
      }
      setIsSubmitting(false);
      if (!validation.ok) {
        setErrors({ service: validation.message });
        return;
      }
      setPlan(validation.plan ?? null);
    }

    if (step < 3) {
      setStep((step + 1) as Step);
    }
  }

  async function handleActivate() {
    setIsSubmitting(true);
    setErrors({});

    const tenant: TenantActivationInfo = {
      businessName: values.businessName.trim(),
      storeCount: Number(values.storeCount),
    };
    const store: StoreActivationInfo = {
      storeName: values.storeName.trim(),
      storeType: values.storeType || "Diğer",
      city: values.city.trim(),
      district: values.district.trim(),
      phone: values.storePhone.trim() || undefined,
    };
    const owner: OwnerAccountInfo = {
      fullName: values.ownerFullName.trim(),
      email: values.accountEmail.trim(),
      phone: values.ownerPhone.trim() || undefined,
      password: values.password,
      termsAccepted: values.termsAccepted,
    };

    let activation: LicenseActivationResult;
    try {
      activation = await activateLicense({
        license: { licenseKey: values.licenseKey, ownerEmail: values.ownerEmail },
        tenant,
        store,
        owner,
      });
    } catch {
      setIsSubmitting(false);
      setErrors({ service: activationErrorMessage });
      return;
    }

    setIsSubmitting(false);
    if (!activation.ok) {
      setErrors({ service: activation.message });
      return;
    }
    setResult(activation);
    setStep(4);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 3) {
      void handleActivate();
      return;
    }
    void handleNext();
  }

  function back() {
    if (step > 0 && step < 4) setStep((step - 1) as Step);
  }

  return (
    <Card className="activation-card" padding="lg">
      <ol className="activation-stepper" aria-label="Aktivasyon adımları">
        {steps.map((label, index) => (
          <li
            aria-current={index === step ? "step" : undefined}
            aria-label={`${index + 1}. ${label}, ${
              index < step ? "tamamlandı" : index === step ? "aktif adım" : "bekleyen adım"
            }`}
            className={index <= step ? "is-active" : ""}
            key={label}
          >
            <span>{index + 1}. {label}</span>
            <small>{index < step ? "Tamamlandı" : index === step ? "Aktif" : "Bekliyor"}</small>
          </li>
        ))}
      </ol>

      <form className="activation-form" onSubmit={handleSubmit} noValidate>
        {step === 0 ? (
          <div className="activation-fields">
            <Field
              error={errors.licenseKey}
              id="activation-license-key"
              label="Lisans anahtarı"
              placeholder="SHLF-XXXX-XXXX"
              value={values.licenseKey}
              onChange={(value) => updateField("licenseKey", value)}
            />
            <Field
              error={errors.ownerEmail}
              id="activation-owner-email"
              label="Lisans sahibi e-posta"
              placeholder="ornek@magaza.com"
              type="email"
              value={values.ownerEmail}
              onChange={(value) => updateField("ownerEmail", value)}
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="activation-fields activation-fields--grid">
            <Field error={errors.businessName} id="activation-business-name" label="İşletme adı" value={values.businessName} onChange={(value) => updateField("businessName", value)} />
            <Field error={errors.storeName} id="activation-store-name" label="Mağaza adı" value={values.storeName} onChange={(value) => updateField("storeName", value)} />
            <label className="form-field">
              <span>Mağaza tipi</span>
              <select
                aria-describedby={errors.storeType ? "activation-store-type-error" : undefined}
                aria-invalid={Boolean(errors.storeType)}
                id="activation-store-type"
                value={values.storeType}
                onChange={(event) => updateField("storeType", event.target.value as BusinessType | "")}
              >
                <option value="">Seçiniz</option>
                {storeTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
              {errors.storeType ? <small id="activation-store-type-error" role="alert">{errors.storeType}</small> : null}
            </label>
            <Field error={errors.city} id="activation-city" label="Şehir" value={values.city} onChange={(value) => updateField("city", value)} />
            <Field error={errors.district} id="activation-district" label="İlçe" value={values.district} onChange={(value) => updateField("district", value)} />
            <Field id="activation-store-phone" label="Telefon" value={values.storePhone} onChange={(value) => updateField("storePhone", value)} />
            <Field error={errors.storeCount} id="activation-store-count" label="Mağaza sayısı" type="number" value={values.storeCount} onChange={(value) => updateField("storeCount", value)} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="activation-fields activation-fields--grid">
            <Field error={errors.ownerFullName} id="activation-owner-full-name" label="Yetkili adı soyadı" value={values.ownerFullName} onChange={(value) => updateField("ownerFullName", value)} />
            <Field error={errors.accountEmail} id="activation-account-email" label="E-posta" type="email" value={values.accountEmail} onChange={(value) => updateField("accountEmail", value)} />
            <Field id="activation-owner-phone" label="Telefon" value={values.ownerPhone} onChange={(value) => updateField("ownerPhone", value)} />
            <Field error={errors.password} id="activation-password" label="Şifre" type="password" value={values.password} onChange={(value) => updateField("password", value)} />
            <Field error={errors.passwordRepeat} id="activation-password-repeat" label="Şifre tekrar" type="password" value={values.passwordRepeat} onChange={(value) => updateField("passwordRepeat", value)} />
            <label className="consent-field activation-consent">
              <input
                aria-describedby={errors.termsAccepted ? "activation-terms-error" : undefined}
                aria-invalid={Boolean(errors.termsAccepted)}
                checked={values.termsAccepted}
                id="activation-terms"
                type="checkbox"
                onChange={(event) => updateField("termsAccepted", event.target.checked)}
              />
              <span>
                <Link href={routes.legalKvkk} target="_blank" style={{ color: "var(--color-primary)", fontWeight: "800" }}>KVKK</Link> ve <Link href={routes.legalTerms} target="_blank" style={{ color: "var(--color-primary)", fontWeight: "800" }}>kullanım şartları</Link> bilgilendirmesini kabul ediyorum.
              </span>
            </label>
            {errors.termsAccepted ? <small className="form-error" id="activation-terms-error" role="alert">{errors.termsAccepted}</small> : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="activation-summary">
            <Summary label="Plan adı" value={plan?.planName ?? "Seçilecek plan"} />
            <Summary label="Lisans durumu" value="Aktivasyon için hazırlanıyor" />
            <Summary label="İşletme adı" value={values.businessName} />
            <Summary label="Mağaza adı" value={values.storeName} />
            <Summary label="Yetkili kullanıcı" value={values.ownerFullName} />
            <Summary label="Panel yönlendirme" value={getShelfioRedirectUrl()} />
          </div>
        ) : null}

        {step === 4 && result ? (
          <div className="activation-success">
            <h2>Aktivasyon ön hazırlığınız tamamlandı.</h2>
            <p>
              Shelfio hesabınız lisans, mağaza ve kullanıcı yetkisi kontrolleri tamamlandıktan
              sonra kullanıma açılır.
            </p>
            <div className="activation-actions">
              <Button href={routes.accountLicenses} size="lg">
                Lisanslarımı gör
              </Button>
              <Button href={routes.accountLicenses} size="lg" variant="outline">
                Lisanslarımı Gör
              </Button>
            </div>
          </div>
        ) : null}

        {errors.service ? <p className="form-error activation-service-error" role="alert">{errors.service}</p> : null}

        {step < 4 ? (
          <div className="activation-actions">
            {step > 0 ? (
              <Button onClick={back} type="button" variant="outline">
                Geri
              </Button>
            ) : null}
            <Button disabled={isSubmitting} type="submit">
              {step === 3 ? "Aktivasyonu Tamamla" : isSubmitting ? "Kontrol Ediliyor" : "İleri"}
            </Button>
          </div>
        ) : null}
      </form>
    </Card>
  );
}

function Field({
  error,
  id,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        id={id}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <small id={`${id}-error`} role="alert">{error}</small> : null}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

