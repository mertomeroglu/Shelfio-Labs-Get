import { workflowSteps } from "@/config/home";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ModuleIcon } from "@/components/ui/ModuleIcon";

export function HowItWorks() {
  return (
    <section className="section workflow-section">
      <Container>
        <SectionHeader
          description="Lisans doğrulama ve hesap aktivasyonu güvenli sunucu doğrulamasıyla çalışacak şekilde tasarlanır."
          eyebrow="Nasıl çalışır"
          title="Shelfio’ya erişim lisanslı ve kontrollüdür."
        />
        <div className="workflow-grid">
          {workflowSteps.map((step, index) => (
            <Card className="workflow-card" key={step.title} padding="sm">
              <div className="workflow-card__top">
                <span>{index + 1}</span>
                <ModuleIcon name={step.icon} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
