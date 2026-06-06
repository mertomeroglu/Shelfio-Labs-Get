import { routes } from "@/lib/routes";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export function FeaturesHero() {
  return (
    <section className="features-hero">
      <Container className="features-hero__inner">
        <div className="features-hero__copy">
          <Badge variant="accent">Özellikler</Badge>
          <h1>Shelfio mağaza operasyonunu tek sistemde birleştirir.</h1>
          <p>
            Stok, POS, depo-reyon, satın alma, görev, raporlama, ESL ve mobil süreçleri
            birbirinden kopuk çalışmak zorunda değil.
          </p>
          <div className="features-hero__actions">
            <Button href={routes.demo} size="lg">
              Demo Talep Et
            </Button>
            <Button href={routes.pricing} size="lg" variant="light">
              Paketleri İncele
            </Button>
          </div>
        </div>
        <Card className="features-hero__panel" padding="lg" variant="dark">
          <p className="eyebrow">Tek veri akışı</p>
          <div className="features-hero__metrics">
            <span>POS</span>
            <span>Stok</span>
            <span>Tedarik</span>
            <span>Mobil</span>
          </div>
          <p>
            Mağaza sahibi, yönetici ve personel aynı operasyon omurgasında farklı görünürlüklerle
            çalışır.
          </p>
        </Card>
      </Container>
    </section>
  );
}
