import { routes } from "@/lib/routes";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function PricingHero() {
  return (
    <section className="pricing-hero">
      <Container className="pricing-hero__inner">
        <Badge variant="accent">Fiyatlandırma</Badge>
        <h1>Mağazanızın ölçeğine uygun Shelfio planını seçin.</h1>
        <p>
          Stok, POS, tedarik, raporlama ve mobil operasyon modüllerini işletmenizin büyüklüğüne
          göre kullanın.
        </p>
        <div className="pricing-hero__actions">
          <Button href={routes.demo} size="lg">
            Demo Talep Et
          </Button>
          <Button href="#plan-karsilastirma" size="lg" variant="light">
            Planları Karşılaştır
          </Button>
        </div>
      </Container>
    </section>
  );
}
