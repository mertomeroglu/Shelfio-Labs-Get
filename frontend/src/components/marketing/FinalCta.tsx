import { homeCtas } from "@/config/home";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function FinalCta() {
  return (
    <section className="final-cta">
      <Container className="final-cta__inner">
        <div>
          <p className="eyebrow">Başlamaya hazır</p>
          <h2>Mağaza operasyonunuzu Shelfio ile tek merkezde toplayın.</h2>
          <p>
            Stok, POS, tedarik, görev ve raporlama süreçlerini birbirinden kopuk araçlarla yönetmek
            yerine Shelfio’da birleştirin.
          </p>
        </div>
        <div className="final-cta__actions">
          <Button href={homeCtas.demo} size="lg">
            Demo Talep Et
          </Button>
          <Button href={homeCtas.pricing} size="lg" variant="light">
            Paketleri İncele
          </Button>
        </div>
      </Container>
    </section>
  );
}
