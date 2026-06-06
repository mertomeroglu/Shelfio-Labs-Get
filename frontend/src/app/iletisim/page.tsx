import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/Icon";
import { routes } from "@/lib/routes";

const contactEmail = "info@getshelfio.com";

export const metadata: Metadata = {
  title: "İletişim",
  description: "GetShelfio resmi şirket iletişim bilgileri, adres, telefon ve e-posta adresleri.",
};

const contactItems: Array<{
  icon: IconName;
  label: string;
  value: ReactNode;
}> = [
  {
    icon: "building",
    label: "Şirket Unvanı",
    value: "Shelfio Stok Takip ve Elektronik Etiket Sistemleri Teknoloji A.Ş.",
  },
  {
    icon: "map-pin",
    label: "Adres",
    value: "Kazımdirik, 372. Sk. Bornova / İzmir",
  },
  {
    icon: "email",
    label: "E-posta",
    value: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>,
  },
  {
    icon: "phone",
    label: "Telefon",
    value: "+90 (232) 555 12 34",
  },
];

export default function ContactPage() {
  return (
    <section className="contact-page">
      <Container className="contact-page__inner">
        <div className="contact-page__header">
          <p className="eyebrow">Bize Ulaşın</p>
          <h1>İletişim Bilgileri</h1>
          <p>
            GetShelfio ile ilgili resmi yazışmalar, kurumsal iş birlikleri ve genel bilgi talepleriniz
            için aşağıdaki iletişim kanallarını kullanabilirsiniz.
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
            <h2>Teknik bir sorun mu yaşıyorsunuz?</h2>
            <p>
              Teknik ekibimize iletmek üzere hızlıca bir destek talebi oluşturabilirsiniz.
            </p>
          </div>
          <Button href={routes.support} size="sm">
            Destek Sayfasına Git
          </Button>
        </Card>
      </Container>
    </section>
  );
}
