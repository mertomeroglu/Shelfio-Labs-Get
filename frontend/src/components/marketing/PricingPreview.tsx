import { homeCtas, landingPlans } from "@/config/home";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function PricingPreview() {
  return (
    <section className="section pricing-section" id="pricing-preview">
      <Container>
        <SectionHeader
          description="Planları mağaza ölçeğinize göre karşılaştırın; kapsam demo ve teklif akışında netleşir."
          eyebrow="Fiyatlandırma"
          title="Mağazanızın ölçeğine göre başlayın."
        />
        <div className="pricing-grid">
          {landingPlans.map((plan) => (
            <Card
              className="pricing-card"
              interactive
              key={plan.name}
              padding="lg"
              variant={plan.highlighted ? "elevated" : "default"}
            >
              {plan.highlighted ? <Badge variant="primary">En Çok Tercih Edilen</Badge> : null}
              <div>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
              </div>
              <strong>{plan.price}</strong>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Button href={homeCtas.pricing} variant={plan.highlighted ? "primary" : "outline"}>
                Paketleri İncele
              </Button>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
