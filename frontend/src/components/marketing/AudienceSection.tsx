import { featureAudiences } from "@/config/modules";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function AudienceSection() {
  return (
    <section className="section audience-section">
      <Container>
        <SectionHeader
          align="center"
          description="Shelfio, tek mağazadan büyüyen yerel zincire kadar operasyonu görünür ve yönetilebilir hale getirmek için kurgulanır."
          eyebrow="Kimler için uygun?"
          title="Mağaza yapınız büyüdükçe Shelfio akışı genişler."
        />
        <div className="audience-grid">
          {featureAudiences.map((audience) => (
            <Card className="audience-card" key={audience} padding="sm">
              <span aria-hidden="true">✓</span>
              <p>{audience}</p>
            </Card>
          ))}
        </div>
        <Card className="features-final-cta" padding="lg" variant="dark">
          <div>
            <p className="eyebrow">Birlikte görelim</p>
            <h2>Shelfio’nun mağazanızda nasıl çalışacağını birlikte görelim.</h2>
          </div>
          <div className="features-final-cta__actions">
            <Button href={routes.demo} size="lg">
              Demo Talep Et
            </Button>
            <Button href={routes.activationLogin} size="lg" variant="light">
              Lisans Anahtarım Var
            </Button>
          </div>
        </Card>
      </Container>
    </section>
  );
}
