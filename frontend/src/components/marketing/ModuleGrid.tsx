import { homeModules } from "@/config/home";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FeatureCard } from "@/components/marketing/FeatureCard";

export function ModuleGrid() {
  return (
    <section className="section section--soft module-section" id="modules">
      <Container>
        <SectionHeader
          description="Stoktan kasaya, tedarikten mobil operasyona kadar mağaza içindeki ana süreçler aynı ticari omurgada birleşir."
          eyebrow="Modüller"
          title="Shelfio mağaza operasyonunun temel modüllerini birleştirir."
        />
        <div className="module-grid">
          {homeModules.map((module) => (
            <FeatureCard
              description={module.description}
              icon={module.icon}
              key={module.title}
              meta={module.meta}
              title={module.title}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
