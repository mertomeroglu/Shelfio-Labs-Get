import { heroSignals, heroStats, homeCtas } from "@/config/home";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export function HomeHero() {
  return (
    <section className="home-hero">
      <Container className="home-hero__inner">
        <div className="home-hero__copy">
          <h1>Mağazanızın stok, kasa ve tedarik operasyonlarını tek sistemden yönetin.</h1>
          <p>
            Shelfio; küçük ve orta ölçekli marketler, mağazalar ve büyüyen perakende işletmeleri
            için geliştirilmiş stok takip, POS, depo-reyon yönetimi, tedarik ve operasyon
            platformudur.
          </p>
          <div className="home-hero__actions">
            <Button href={homeCtas.demo} size="lg">
              Demo Talep Et
            </Button>
            <Button href={homeCtas.pricing} size="lg" variant="light">
              Paketleri İncele
            </Button>
          </div>
          <div className="home-hero__signals" aria-label="Shelfio güven sinyalleri">
            {heroSignals.map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
        </div>
        <Card className="hero-dashboard" padding="lg" variant="dark">
          <div className="hero-dashboard__top">
            <div>
              <p className="eyebrow">Canlı operasyon özeti</p>
              <h2>Shelfio Panel</h2>
            </div>
            <span className="hero-dashboard__status">Lisanslı erişim</span>
          </div>
          <div className="hero-dashboard__stats">
            {heroStats.map((stat) => (
              <div className={`hero-stat hero-stat--${stat.tone}`} key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
          <div className="hero-dashboard__chart" aria-label="Günlük satış grafiği">
            <span style={{ height: "46%" }} />
            <span style={{ height: "62%" }} />
            <span style={{ height: "38%" }} />
            <span style={{ height: "74%" }} />
            <span style={{ height: "58%" }} />
            <span style={{ height: "84%" }} />
            <span style={{ height: "68%" }} />
          </div>
          <div className="hero-dashboard__flow">
            <span>Sipariş</span>
            <span>Onay</span>
            <span>Teslim</span>
            <span>Reyon</span>
          </div>
        </Card>
      </Container>
    </section>
  );
}
