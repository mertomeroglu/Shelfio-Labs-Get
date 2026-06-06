import type { Metadata } from "next";
import { DemoRequestForm } from "@/components/marketing/DemoRequestForm";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Demo",
  description:
    "Shelfio demo talep formu ile mağazanız için uygun stok, POS, tedarik ve mobil operasyon kapsamını birlikte planlayın.",
};

const processSteps = [
  "Başvurunuzu alırız.",
  "Mağaza yapınızı ve ihtiyaç duyduğunuz modülleri netleştiririz.",
  "Size uygun 1 haftalık demo kullanım sürecini planlarız.",
  "Demo sonunda lisans, aktivasyon ve kurulum adımlarını birlikte değerlendiririz.",
];

const discussionItems = [
  "Stok, depo ve reyon ayrımı",
  "POS ve kasa akışı",
  "Tedarik ve sipariş önerileri",
  "Raporlama ve operasyon yönetimi",
  "ESL / elektronik raf etiketi ihtiyacı",
  "Kullanıcı, mağaza ve yetki kapsamı",
];

export default function DemoPage() {
  return (
    <>
      <section className="demo-hero">
        <Container className="demo-hero__inner">
          <div>
            <p className="eyebrow">Demo ve teklif</p>
            <h1>Size uygun Shelfio kurulumunu birlikte planlayalım.</h1>
            <p>
              Mağaza yapınızı, ihtiyaç duyduğunuz modülleri ve operasyon akışınızı paylaşın;
              ekibimiz size en uygun demo ve teklif süreci için dönüş yapsın.
            </p>
          </div>
          <Card className="demo-hero__note" padding="lg" variant="dark">
            <p className="eyebrow">Demo kapsamı</p>
            <h2>1 haftalık demo kullanım sürecini birlikte netleştiririz.</h2>
            <p>
              Talebiniz mağaza ölçeği, modül ihtiyacı ve aktivasyon kapsamı üzerinden değerlendirilir.
            </p>
          </Card>
        </Container>
      </section>
      <section className="section demo-form-section">
        <Container className="demo-form-layout">
          <DemoRequestForm />
          <aside className="demo-side-panel">
            <InfoCard title="Demo süreci nasıl ilerler?" items={processSteps} />
            <InfoCard title="Demo görüşmesinde neleri netleştiririz?" items={discussionItems} tinted />
          </aside>
        </Container>
      </section>
    </>
  );
}

function InfoCard({ items, tinted = false, title }: { items: string[]; tinted?: boolean; title: string }) {
  return (
    <Card padding="lg" variant={tinted ? "tinted" : "default"}>
      <p className="eyebrow">{title}</p>
      <ol>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ol>
    </Card>
  );
}
