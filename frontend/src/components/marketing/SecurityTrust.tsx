import { securityItems } from "@/config/home";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { ModuleIcon } from "@/components/ui/ModuleIcon";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function SecurityTrust() {
  return (
    <section className="section security-section">
      <Container>
        <SectionHeader
          align="center"
          description="Shelfio hizmet sitesi, tanıtım ve aktivasyon kapısı olarak tasarlanır; lisans doğrulama ve hesap aktivasyonu güvenli sunucu doğrulamasıyla çalışacak şekilde kurgulanır."
          eyebrow="Güven ve erişim"
          title="Lisanslı erişim, rol bazlı kullanım ve mağaza operasyon güvenliği."
        />
        <div className="security-grid">
          {securityItems.map((item) => (
            <Card className="security-card" key={item.label} padding="sm" variant="dark">
              <div className="security-card__head">
                <ModuleIcon name={item.icon} />
                <Badge variant="accent">Kontrollü</Badge>
              </div>
              <p>{item.label}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
