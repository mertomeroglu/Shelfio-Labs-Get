import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

const planNames: Record<string, string> = {
  baslangic: "Başlangıç",
  profesyonel: "Profesyonel",
  kurumsal: "Kurumsal",
};

export const metadata: Metadata = {
  title: "Satın Alım Tamamlandı",
};

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; reference?: string }>;
}) {
  const { plan, reference } = await searchParams;
  if (!plan || !planNames[plan]) redirect(routes.accountLicenses);

  return (
    <section className="checkout-complete-page">
      <Container className="checkout-complete-layout">
        <Card className="checkout-complete-card" padding="lg" variant="elevated">
          <div className="checkout-complete-icon" aria-hidden="true">
            <span>✓</span>
          </div>
          <div className="checkout-complete-copy">
            <p className="eyebrow">Satın alım tamamlandı</p>
            <h1>Lisansınız hazır.</h1>
            <p>{planNames[plan]} planınız hesabınıza eklendi. Lisans durumunu ve aktivasyon adımlarını müşteri portalından takip edebilirsiniz.</p>
          </div>
          <div className="checkout-complete-status">
            <div>
              <span>Plan</span>
              <strong>{planNames[plan]}</strong>
            </div>
            {reference && (
              <div>
                <span>İşlem Referansı</span>
                <strong style={{ wordBreak: "break-all", fontFamily: "var(--font-mono, monospace)", fontSize: "0.88rem" }}>{reference}</strong>
              </div>
            )}
            <div>
              <span>Lisans durumu</span>
              <strong>Aktif</strong>
            </div>
            <div>
              <span>Sonraki aksiyon</span>
              <strong>Aktivasyon adımları</strong>
            </div>
          </div>
          <div className="checkout-complete-actions">
            <Button href={routes.accountLicenses}>Lisanslarımı Gör</Button>
            <Button href={routes.accountActivation} variant="outline">Aktivasyona Git</Button>
            <Button href={routes.account} variant="outline">Hesabıma Dön</Button>
          </div>
        </Card>
        <Link className="checkout-complete-link" href={routes.pricing}>Planlara geri dön</Link>
      </Container>
    </section>
  );
}

