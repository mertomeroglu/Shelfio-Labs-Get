import { featureModules } from "@/config/modules";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { ModuleIcon } from "@/components/ui/ModuleIcon";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function FeatureOverviewGrid() {
  return (
    <section className="section section--soft features-overview">
      <Container>
        <SectionHeader
          description="Shelfio yalnızca stok takibi değil; satış, tedarik, reyon, raporlama ve mobil operasyonları aynı ticari merkezde toplar."
          eyebrow="Modül genel bakış"
          title="Mağaza operasyonunun ana parçaları aynı sistemde çalışır."
        />
        <div className="features-overview__grid">
          {featureModules.map((module) => (
            <Card className="features-overview-card" interactive key={module.slug} padding="sm">
              <div className="features-overview-card__header">
                <ModuleIcon name={module.icon} />
                <div className="features-overview-card__header-info">
                  <Badge variant="neutral">{module.meta}</Badge>
                  <h3>{module.title}</h3>
                </div>
              </div>
              <p className="features-overview-card__description">{module.description}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
