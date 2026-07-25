import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Contact",
  description: "GetShelfio support and project contact information.",
};

const contactItems: Array<{
  icon: IconName;
  label: string;
  value: ReactNode;
}> = [
  {
    icon: "building",
    label: "Project",
    value: "GetShelfio service portal",
  },
  {
    icon: "email",
    label: "E-posta",
    value: <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>,
  },
];

export default function ContactPage() {
  return (
    <section className="contact-page">
      <Container className="contact-page__inner">
        <div className="contact-page__header">
          <p className="eyebrow">Bize Ulasin</p>
          <h1>Iletisim Bilgileri</h1>
          <p>
            GetShelfio hakkinda genel bilgi, demo talepleri ve destek ihtiyaclari icin asagidaki
            iletisim kanalini kullanabilirsiniz.
          </p>
        </div>

        <Card className="contact-info-card" padding="lg">
          <div className="contact-info-list">
            {contactItems.map((item) => (
              <div className="contact-info-row" key={item.label}>
                <span className="contact-info-row__icon" aria-hidden="true">
                  <Icon name={item.icon} />
                </span>
                <div>
                  <h2>{item.label}</h2>
                  <p>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="contact-support-card">
          <div>
            <h2>Teknik bir sorun mu yasiyorsunuz?</h2>
            <p>Teknik ekibimize iletmek uzere hizlica bir destek talebi olusturabilirsiniz.</p>
          </div>
          <Button href={routes.support} size="sm">
            Destek Sayfasina Git
          </Button>
        </Card>
      </Container>
    </section>
  );
}
