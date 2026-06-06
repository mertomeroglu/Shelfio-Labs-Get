import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ModuleIcon } from "@/components/ui/ModuleIcon";

type FeatureCardProps = {
  description: string;
  icon?: string;
  meta?: string;
  title: string;
};

export function FeatureCard({ description, icon, meta, title }: FeatureCardProps) {
  return (
    <Card className="feature-card" interactive>
      <div className="feature-card__head">
        <ModuleIcon name={icon} />
        {meta ? <Badge variant="neutral">{meta}</Badge> : null}
      </div>
      <div className="feature-card__body">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </Card>
  );
}
