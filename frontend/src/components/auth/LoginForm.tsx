"use client";

import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, register, type LoginRole } from "@/services/authService";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";

type AuthMode = "customer" | "register" | "admin";
type FieldErrors = Partial<Record<"businessName" | "confirmPassword" | "consent" | "email" | "form" | "fullName" | "password" | "phone", string>>;

const authOptions: Record<AuthMode, {
  description: string;
  helper: string;
  icon: ReactNode;
  title: string;
}> = {
  customer: {
    description: "Lisans, aktivasyon ve müşteri portalı işlemleriniz için giriş yapın.",
    helper: "Lisans ve portal işlemleriniz için güvenli giriş.",
    icon: <CustomerIcon />,
    title: "Müşteri Girişi",
  },
  register: {
    description: "Yeni müşteri hesabı oluşturarak aktivasyon ve portal sürecini başlatın.",
    helper: "Hesabınız demo, aktivasyon ve müşteri portal süreçlerinde kullanılır.",
    icon: <RegisterIcon />,
    title: "Hesap Oluştur",
  },
  admin: {
    description: "Lisans yönetimi ve servis operasyonları için yetkili yönetici girişi.",
    helper: "Yalnızca yetkili yöneticiler içindir.",
    icon: <AdminIcon />,
    title: "Admin Girişi",
  },
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function LoginForm({
  initialModeParam,
  nextPath,
}: {
  initialModeParam?: string;
  nextPath?: string;
}) {
  const router = useRouter();
  const initialMode = getInitialMode(initialModeParam ?? null);
  const [activeMode, setActiveMode] = useState<AuthMode | null>(initialModeParam ? initialMode : null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const customerRedirect = getCustomerRedirect(nextPath);

  useEffect(() => {
    if (!activeMode) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(focusableSelector);
      firstFocusable?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [activeMode]);

  function openModal(nextMode: AuthMode) {
    setActiveMode(nextMode);
    setErrors({});
    setShowPassword(false);
  }

  function closeModal() {
    if (submitting) return;
    setActiveMode(null);
    setErrors({});
  }

  function handleModalKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab" || !modalRef.current) return;

    const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => element.offsetParent !== null || element === document.activeElement);

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeMode || submitting) return;

    const validationErrors = activeMode === "register"
      ? validateRegisterFields({ businessName, confirmPassword, consent, email, fullName, password, phone })
      : validateLoginFields(email, password);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      if (activeMode === "register") {
        await register({ businessName, email, fullName, password, phone });
        router.replace(customerRedirect);
      } else {
        const role: LoginRole = activeMode === "admin" ? "admin" : "customer";
        const user = await login(email, password, role);
        router.replace(user.role === "admin" ? routes.admin : customerRedirect);
      }
      router.refresh();
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "İşlem tamamlanamadı." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-choice" aria-label="Giriş seçenekleri">
      <div className="auth-choice__header">
        <span>Güvenli erişim</span>
        <strong>Size uygun akışı seçin</strong>
      </div>
      <div className="auth-choice__grid">
        {(Object.keys(authOptions) as AuthMode[]).map((mode) => {
          const option = authOptions[mode];

          return (
            <button
              aria-haspopup="dialog"
              className="auth-choice-card"
              data-mode={mode}
              key={mode}
              onClick={() => openModal(mode)}
              type="button"
            >
              <span className="auth-choice-card__icon" aria-hidden="true">{option.icon}</span>
              <span className="auth-choice-card__content">
                <strong>{option.title}</strong>
                <span>{option.description}</span>
              </span>
              <span className="auth-choice-card__arrow" aria-hidden="true">→</span>
            </button>
          );
        })}
      </div>

      {activeMode ? (
        <div
          aria-labelledby="auth-modal-title"
          aria-describedby="auth-modal-description"
          aria-modal="true"
          className="auth-modal"
          onKeyDown={handleModalKeyDown}
          role="dialog"
        >
          <button aria-label="Pencereyi kapat" className="auth-modal__backdrop" onClick={closeModal} type="button" />
          <div className="auth-modal__panel" ref={modalRef}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">Shelfio</span>
                <h2 id="auth-modal-title">{authOptions[activeMode].title}</h2>
                <p id="auth-modal-description">{authOptions[activeMode].helper}</p>
              </div>
              <button aria-label="Pencereyi kapat" className="auth-modal__close" onClick={closeModal} type="button">
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <form className="login-form" noValidate onSubmit={handleSubmit}>
              {activeMode === "register" ? (
                <>
                  <div className="login-form__grid">
                    <Field error={errors.fullName} id="register-full-name" label="Ad soyad" onChange={setFullName} value={fullName} />
                    <Field error={errors.email} id="register-email" label="E-posta" onChange={setEmail} type="email" value={email} />
                    <Field error={errors.phone} id="register-phone" label="Telefon" onChange={setPhone} required={true} type="tel" value={phone} />
                    <Field error={errors.businessName} id="register-business" label="İşletme adı" onChange={setBusinessName} value={businessName} />
                  </div>
                  <PasswordField
                    autoComplete="new-password"
                    error={errors.password}
                    id="register-password"
                    label="Şifre"
                    onChange={setPassword}
                    showPassword={showPassword}
                    toggleShowPassword={() => setShowPassword((value) => !value)}
                    value={password}
                  />
                  <PasswordChecklist password={password} confirmPassword={confirmPassword} />
                  <Field
                    error={errors.confirmPassword}
                    id="register-confirm-password"
                    label="Şifre tekrar"
                    onChange={setConfirmPassword}
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                  />
                  <div className="login-consent">
                    <input checked={consent} id="register-consent" onChange={(event) => setConsent(event.target.checked)} type="checkbox" />
                    <label htmlFor="register-consent">
                      <Link href={routes.legalKvkk}>KVKK</Link> ve <Link href={routes.legalTerms}>kullanım koşullarını</Link> okudum, hesap oluşturma akışını onaylıyorum.
                    </label>
                  </div>
                  {errors.consent ? <small className="form-error">{errors.consent}</small> : null}
                </>
              ) : (
                <>
                  <Field error={errors.email} id={`${activeMode}-login-email`} label="E-posta" onChange={setEmail} type="email" value={email} />
                  <PasswordField
                    autoComplete="current-password"
                    error={errors.password}
                    id={`${activeMode}-login-password`}
                    label="Şifre"
                    onChange={setPassword}
                    showPassword={showPassword}
                    toggleShowPassword={() => setShowPassword((value) => !value)}
                    value={password}
                  />
                </>
              )}

              {errors.form ? <p aria-live="polite" className="login-form__error">{errors.form}</p> : null}
              <Button disabled={submitting} size="lg" type="submit">{getSubmitLabel(activeMode, submitting)}</Button>
              {activeMode === "customer" ? <a className="login-forgot-link" href="/sifremi-unuttum">Şifremi unuttum</a> : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getCustomerRedirect(nextPath?: string) {
  if (nextPath?.startsWith("/hesap/") || nextPath === routes.account) return nextPath;
  return routes.account;
}

function Field({
  error,
  id,
  label,
  onChange,
  required = true,
  type = "text",
  value,
}: {
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}{required ? null : <span> opsiyonel</span>}</label>
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={type === "email" ? "email" : undefined}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      {error ? <small className="form-error" id={`${id}-error`}>{error}</small> : null}
    </div>
  );
}

function PasswordField({
  autoComplete,
  error,
  id,
  label,
  onChange,
  showPassword,
  toggleShowPassword,
  value,
}: {
  autoComplete: "current-password" | "new-password";
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  value: string;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          type={showPassword ? "text" : "password"}
          value={value}
        />
        <button onClick={toggleShowPassword} type="button">{showPassword ? "Gizle" : "Göster"}</button>
      </div>
      {error ? <small className="form-error" id={`${id}-error`}>{error}</small> : null}
    </div>
  );
}

function validateLoginFields(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  validateEmail(email, errors);
  if (!password) errors.password = "Şifre zorunludur.";
  return errors;
}

function validateRegisterFields(values: {
  businessName: string;
  confirmPassword: string;
  consent: boolean;
  email: string;
  fullName: string;
  password: string;
  phone: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.fullName.trim()) errors.fullName = "Ad soyad zorunludur.";
  if (!values.businessName.trim()) errors.businessName = "İşletme adı zorunludur.";
  
  const phoneClean = values.phone.trim();
  const phoneDigits = phoneClean.replace(/\D/g, "");
  if (!phoneClean) {
    errors.phone = "Lütfen geçerli bir telefon numarası girin.";
  } else if (!/^[0-9\s+\-()]+$/.test(phoneClean) || phoneDigits.length < 10) {
    errors.phone = "Lütfen geçerli bir telefon numarası girin.";
  }

  validateEmail(values.email, errors);
  validateRegisterPassword(values.password, errors);
  if (values.confirmPassword !== values.password) errors.confirmPassword = "Şifreler eşleşmiyor.";
  if (!values.consent) errors.consent = "Devam etmek için onay vermelisiniz.";
  return errors;
}

function validateEmail(email: string, errors: FieldErrors) {
  if (!email.trim()) errors.email = "E-posta zorunludur.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Geçerli bir e-posta adresi girin.";
}

function validateRegisterPassword(password: string, errors: FieldErrors) {
  if (!password) errors.password = "Şifre zorunludur.";
  else if (password.length < 8) errors.password = "Şifre en az 8 karakter olmalıdır.";
  else if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password) || !/\d/.test(password)) {
    errors.password = "Şifre en az bir harf ve bir rakam içermelidir.";
  }
}

function PasswordChecklist({ confirmPassword, password }: { confirmPassword: string; password: string }) {
  const checks = [
    { ok: password.length >= 8, text: "8+ Karakter" },
    { ok: /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password), text: "1 Harf" },
    { ok: /\d/.test(password), text: "1 Rakam" },
    { ok: Boolean(confirmPassword) && confirmPassword === password, text: "Eşleşme" },
  ];

  return (
    <div className="password-checklist-compact" aria-label="Şifre kuralları">
      {checks.map((check) => (
        <span className={`password-check-item-chip ${check.ok ? "is-ok" : ""}`} key={check.text}>
          <span className="password-check-item-chip__mark" aria-hidden="true">{check.ok ? "✓" : ""}</span>
          {check.text}
        </span>
      ))}
    </div>
  );
}

function getInitialMode(mode: string | null): AuthMode {
  if (mode === "admin") return "admin";
  if (mode === "register") return "register";
  return "customer";
}

function getSubmitLabel(mode: AuthMode, submitting: boolean) {
  if (submitting) return "İşlem yapılıyor...";
  if (mode === "admin") return "Admin olarak giriş yap";
  if (mode === "register") return "Hesap oluştur";
  return "Müşteri olarak giriş yap";
}

function CustomerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  );
}

function RegisterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
      <path d="M4.5 5.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-13Z" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6.2v5.4c0 4.3 2.9 7.8 7 9.4 4.1-1.6 7-5.1 7-9.4V6.2L12 3Z" />
      <path d="m9.5 12 1.7 1.7 3.8-4" />
    </svg>
  );
}
