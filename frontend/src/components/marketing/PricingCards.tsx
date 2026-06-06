"use client";

import { useEffect, useState } from "react";
import { plans } from "@/config/plans";
import { routes } from "@/lib/routes";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getCurrentUser } from "@/services/authService";
import type { CurrentUser } from "@/types/tenant";

const checkoutPlanSlugs = {
  enterprise: "kurumsal",
  professional: "profesyonel",
  starter: "baslangic",
} as const;

export function PricingCards() {
  const [activePlanModal, setActivePlanModal] = useState<string | null>(null);
  const [planToSelect, setPlanToSelect] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    void getCurrentUser().then((currentUser) => {
      setUser(currentUser);
    });
  }, []);

  return (
    <section className="section pricing-page-section">
      <Container>
        <SectionHeader
          description="Plan kapsamı mağaza ölçeğiniz, ihtiyaç duyduğunuz modüller ve kurulum görüşmesi sonrasında netleştirilir."
          eyebrow="Planlar"
          title="Üç farklı operasyon ölçeği için sade plan yapısı."
        />
        <div className="pricing-page-grid">
          {plans.map((plan) => {
            const displayedFeatures = plan.features.slice(0, 5);
            const remainingCount = plan.features.length - displayedFeatures.length;

            return (
              <Card
                className="pricing-page-card"
                interactive
                key={plan.id}
                padding="lg"
                variant={plan.highlighted ? "elevated" : "default"}
              >
                <div className="pricing-page-card__top">
                  {plan.highlighted ? <Badge variant="primary">En Çok Tercih Edilen</Badge> : null}
                  <h2>{plan.name}</h2>
                  <p>{plan.target}</p>
                </div>
                <div className="pricing-page-card__price">
                  <strong>{plan.priceLabel}</strong>
                  <span>{plan.limitLabel}</span>
                </div>
                <p>{plan.description}</p>
                <ul>
                  {displayedFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {remainingCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActivePlanModal(plan.id)}
                    className="pricing-page-card__more-btn"
                  >
                    +{remainingCount} özellik (Detayları Gör)
                  </button>
                ) : (
                  <div className="pricing-page-card__more-placeholder" />
                )}
                <Button
                  onClick={() => {
                    const slug = checkoutPlanSlugs[plan.id];
                    if (user) {
                      window.location.href = `${routes.checkout}?plan=${slug}`;
                    } else {
                      setPlanToSelect(slug);
                    }
                  }}
                  variant={plan.highlighted ? "primary" : "outline"}
                >
                  Planı Seç
                </Button>
              </Card>
            );
          })}
        </div>
      </Container>

      {activePlanModal && (
        <div className="auth-modal" style={{ zIndex: 9999 }}>
          <div className="auth-modal__backdrop" onClick={() => setActivePlanModal(null)} />
          <div className="auth-modal__panel pricing-features-modal">
            <div className="auth-modal__header" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
              <div>
                <span className="auth-modal__eyebrow">PLAN DETAYLARI</span>
                <h2 style={{ fontSize: "1.5rem", color: "var(--color-text-strong)", fontWeight: 800, margin: "4px 0 0 0" }}>
                  {plans.find((p) => p.id === activePlanModal)?.name} Planı
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", margin: "4px 0 0" }}>Tüm plan kapsamı ve özellikleri</p>
              </div>
              <button aria-label="Kapat" className="auth-modal__close" onClick={() => setActivePlanModal(null)} type="button">
                &times;
              </button>
            </div>
            
            <div className="pricing-features-modal__body">
              <ul className="premium-feature-list">
                {plans
                  .find((p) => p.id === activePlanModal)
                  ?.features.map((feature, idx) => (
                    <li key={idx} className="premium-feature-item">
                      <span className="premium-feature-icon">✓</span>
                      <span className="premium-feature-text">{feature}</span>
                    </li>
                  ))}
              </ul>
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
              <Button onClick={() => setActivePlanModal(null)} size="sm">Kapat</Button>
            </div>
          </div>
        </div>
      )}

      {planToSelect && (
        <div aria-labelledby="pricing-gate-title" aria-modal="true" className="auth-modal" role="dialog" style={{ zIndex: 9999 }}>
          <button aria-label="Kapat" className="auth-modal__backdrop" onClick={() => setPlanToSelect(null)} type="button" />
          <div className="auth-modal__panel" style={{ maxWidth: "480px", width: "100%" }}>
            <div className="auth-modal__header">
              <div>
                <span className="auth-modal__eyebrow">Güvenli İşlem</span>
                <h2 id="pricing-gate-title" style={{ fontSize: "1.5rem", color: "var(--color-text-strong)", margin: 0 }}>Giriş Yapmanız Gerekiyor</h2>
                <p style={{ marginTop: "4px" }}>Devam etmek için giriş yapmanız veya hesap oluşturmanız gerekmektedir.</p>
              </div>
              <button aria-label="Kapat" className="auth-modal__close" onClick={() => setPlanToSelect(null)} type="button">
                ×
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "24px" }}>
              <Button
                href={`${routes.login}?next=${encodeURIComponent(`${routes.checkout}?plan=${planToSelect}`)}`}
                variant="primary"
                size="lg"
              >
                Giriş Yap
              </Button>
              <Button
                href={`${routes.login}?mode=register&next=${encodeURIComponent(`${routes.checkout}?plan=${planToSelect}`)}`}
                variant="outline"
                size="lg"
              >
                Hesap Oluştur
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
