import { featureModules } from "@/config/modules";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { ModuleIcon } from "@/components/ui/ModuleIcon";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function FeatureDetailSection() {
  return (
    <section className="section feature-details-section">
      <Container>
        <SectionHeader
          description="Her modül, tek başına bir liste değil; mağaza operasyonunun diğer parçalarıyla birlikte çalışan ürün mantığıdır."
          eyebrow="Modül detayları"
          title="Shelfio modülleri gerçek operasyon akışlarına göre tasarlanır."
        />
        <div className="feature-details">
          {featureModules.map((module) => (
            <Card className="feature-detail-card" key={module.slug} padding="lg">
              <div className="feature-detail-card__copy">
                <div className="feature-detail-card__heading">
                  <ModuleIcon name={module.icon} />
                  <div>
                    <Badge variant="accent">{module.meta}</Badge>
                    <h3>{module.title}</h3>
                  </div>
                </div>
                <p>{module.description}</p>
                <ul>
                  {module.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </div>
              <div className="feature-detail-card__mockup">
                <p className="eyebrow">{module.mockup.label}</p>
                <strong>{module.mockup.value}</strong>
                <div>
                  {module.mockup.details.map((detail) => (
                    <span key={detail}>{detail}</span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
