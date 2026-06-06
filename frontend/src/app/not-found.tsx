import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <section className="page-shell">
      <Container className="page-shell__inner">
        <p className="eyebrow">404</p>
        <h1>Sayfa bulunamadi</h1>
        <p>Bu sistem sayfası, hatalı veya taşınmış rotalarda kullanıcıyı ana akışa geri alacak.</p>
        <Button href={routes.home}>Ana Sayfaya Dön</Button>
      </Container>
    </section>
  );
}
