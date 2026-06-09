"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeCheckout } from "@/services/checkoutService";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

const checkoutPlans = {
  baslangic: { name: "Başlangıç", price: "1 TL / ay", limit: "1 mağaza" },
  profesyonel: { name: "Profesyonel", price: "2 TL / ay", limit: "3 mağaza" },
  kurumsal: { name: "Kurumsal", price: "3 TL / ay", limit: "Çoklu mağaza" },
} as const;

type PlanSlug = keyof typeof checkoutPlans;

type CheckoutFields = {
  billingEmail: string;
  billingName: string;
  cardName: string;
  cardNumber: string;
  cvc: string;
  expDate: string;
};

const initialFields: CheckoutFields = {
  billingEmail: "",
  billingName: "",
  cardName: "",
  cardNumber: "",
  cvc: "",
  expDate: "",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") as PlanSlug | null;
  const selectedPlan = plan && plan in checkoutPlans ? checkoutPlans[plan] : null;
  const [fields, setFields] = useState<CheckoutFields>(initialFields);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutReference] = useState(() => `checkout_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`);

  const title = useMemo(() => selectedPlan ? `${selectedPlan.name} planı` : "Plan seçimi", [selectedPlan]);

  useEffect(() => {
    if (!selectedPlan || !plan) router.replace(routes.pricing);
  }, [plan, router, selectedPlan]);

  if (!selectedPlan || !plan) return null;
  const planSlug = plan;

  function updateField<K extends keyof CheckoutFields>(field: K, value: CheckoutFields[K]) {
    setFields((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateCheckout(fields);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const [expMonth = "", expYear = ""] = fields.expDate.trim().split("/");
      const result = await completeCheckout({
        billingEmail: fields.billingEmail.trim(),
        billingName: fields.billingName.trim() || fields.cardName.trim(),
        cardName: fields.cardName.trim(),
        cardNumber: fields.cardNumber.replace(/\D/g, ""),
        checkoutReference,
        cvc: fields.cvc.trim(),
        expMonth,
        expYear,
        plan: planSlug,
      });
      router.replace(result.redirectUrl);
      router.refresh();
    } catch {
      setError("Satın alım tamamlanamadı. Lütfen bilgileri kontrol edip tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="checkout-page">
      <Container className="checkout-layout">
        <div className="checkout-main-form">
          <div className="checkout-copy">
            <p className="eyebrow">Satın alma</p>
            <h1>{title}</h1>
            <p>Lütfen fatura ve kart bilgilerinizi girerek işlemi tamamlayın.</p>
          </div>
          <Card className="checkout-form-card" padding="lg" variant="elevated">
            <form className="checkout-form" onSubmit={handleSubmit} noValidate>
              <h2 className="form-section-title">Kart Bilgileri</h2>
              <Field id="card-name" label="Kart üzerindeki ad" value={fields.cardName} onChange={(value) => updateField("cardName", value)} />
              <Field id="card-number" label="Kart numarası" inputMode="numeric" value={fields.cardNumber} onChange={(value) => updateField("cardNumber", value)} />
              <div className="checkout-form__split">
                <Field id="card-expiry" label="Son kullanma (AA/YY)" inputMode="numeric" value={fields.expDate} onChange={(value) => updateField("expDate", value)} />
                <Field id="card-cvc" label="CVC" inputMode="numeric" value={fields.cvc} onChange={(value) => updateField("cvc", value)} />
              </div>
              <h2 className="form-section-title" style={{ marginTop: "16px" }}>Fatura Bilgileri</h2>
              <Field id="billing-email" label="Fatura e-posta" type="email" value={fields.billingEmail} onChange={(value) => updateField("billingEmail", value)} />
              <Field id="billing-name" label="Fatura unvanı / işletme adı" value={fields.billingName} onChange={(value) => updateField("billingName", value)} />
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <Button disabled={submitting} size="lg" type="submit" style={{ marginTop: "12px", width: "100%" }}>
                {submitting ? "Tamamlanıyor..." : "Güvenli Ödemeyi Başlat"}
              </Button>
            </form>
          </Card>
        </div>

        <div className="checkout-sidebar">
          <Card className="checkout-summary" padding="lg" variant="tinted">
            <div className="secure-badge">
              <span className="secure-icon" aria-hidden="true">🔒</span>
              <span>GÜVENLİ ÖDEME</span>
            </div>
            
            <div className="summary-section">
              <span className="summary-label">Seçilen Plan</span>
              <strong className="summary-plan-name">{selectedPlan.name}</strong>
              <p className="summary-plan-limit">{selectedPlan.limit}</p>
            </div>
            
            <div className="summary-divider" />
            
            <div className="summary-section">
              <span className="summary-label">İşlem Referansı</span>
              <code className="summary-reference">{checkoutReference}</code>
            </div>

            <div className="summary-divider" />

            <div className="summary-section">
              <span className="summary-label">Toplam Tutar</span>
              <h2 className="summary-price">{selectedPlan.price}</h2>
            </div>

            <div className="summary-divider" />

            <div className="summary-description">
              <p>Ödemeniz 256-bit SSL güvenlik protokolü ile şifrelenir. Lisansınız ödeme sonrasında anında aktif edilecektir.</p>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
}

function Field({
  id,
  inputMode,
  label,
  onChange,
  type = "text",
  value,
}: {
  id: string;
  inputMode?: "email" | "numeric" | "tel" | "text";
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>
        <span>{label}</span>
      </label>
      <input
        id={id}
        inputMode={inputMode}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function validateCheckout(fields: CheckoutFields) {
  const cardNumberDigits = fields.cardNumber.replace(/\D/g, "");
  const cvcValue = fields.cvc.trim();

  if (!fields.cardName.trim()) return "Kart sahibi alanı zorunludur.";
  if (cardNumberDigits.length < 8) return "Kart numarası en az 8 haneli olmalıdır.";
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fields.expDate.trim())) {
    return "Son kullanma tarihi AA/YY formatında olmalıdır.";
  }
  if (!/^\d{3,4}$/.test(cvcValue)) return "Güvenlik kodu 3 veya 4 haneli olmalıdır.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.billingEmail.trim())) return "Geçerli bir fatura e-posta adresi girin.";
  if (!fields.billingName.trim()) return "Fatura unvanı / işletme adı zorunludur.";
  return "";
}
