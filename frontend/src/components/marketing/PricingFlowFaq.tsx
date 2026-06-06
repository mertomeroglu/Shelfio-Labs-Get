import { pricingFaqs } from "@/config/plans";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { ModuleIcon } from "@/components/ui/ModuleIcon";
import { SectionHeader } from "@/components/ui/SectionHeader";

const pricingFlowSteps = [
  ["Plan seç", "Seçtiğiniz planla satın alma akışı başlar."],
  ["Giriş yap veya hesap oluştur", "Hesabınız yoksa kısa kayıt adımıyla devam edersiniz."],
  ["Ödeme bilgilerini gir", "Ödeme bilgileri yalnızca işlem için kullanılır."],
  ["Satın alımı tamamla", "Plan ve ödeme özeti doğrulanır."],
  ["Lisans oluşturulur", "Lisans hesabınıza maskeli şekilde eklenir."],
  ["Hesabında görüntülenir", "Lisans ve fatura kayıtlarını portalda izlersiniz."],
] as const;

const stepIcons = ["layers", "users", "credit-card", "shield-check", "key", "layout-dashboard"] as const;

export function PricingFlowFaq() {
  return (
    <>
      <section className="section pricing-flow-section">
        <Container>
          <SectionHeader
            description="Plan seçiminden lisansın hesabınıza eklenmesine kadar süreç tek akışta ilerler."
            eyebrow="Satış akışı"
            title="Plan seçimi sonrası süreç kontrollü şekilde ilerler."
          />
          <div className="pricing-flow-grid">
            {pricingFlowSteps.map(([title, description], index) => (
              <Card className="pricing-flow-card" key={title} padding="sm">
                <div className="pricing-flow-card__top">
                  <span className="pricing-flow-card__number">{index + 1}</span>
                  <span className="pricing-flow-card__icon" aria-hidden="true">
                    <ModuleIcon name={stepIcons[index]} />
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
      <section className="section pricing-faq-section">
        <Container>
          <SectionHeader eyebrow="SSS" title="Sık sorulan sorular" />
          <div className="pricing-faq-grid">
            {pricingFaqs.map((faq) => (
              <Card className="pricing-faq-card" key={faq.question} padding="md">
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </Card>
            ))}
          </div>
          <Card className="pricing-final-cta" padding="lg" variant="dark">
            <div>
              <p className="eyebrow">Doğru planı belirleyelim</p>
              <h2>Mağazanız için doğru planı birlikte belirleyelim.</h2>
            </div>
            <Button href={routes.demo} size="lg">
              Demo Talep Et
            </Button>
          </Card>
        </Container>
      </section>
    </>
  );
}
