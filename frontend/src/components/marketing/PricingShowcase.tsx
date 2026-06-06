import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";

const showcaseItems = [
  {
    src: "/assets/site-ici/stok-paneli.png",
    title: "Anasayfa",
    description: "Mağaza operasyon özetinizi, kritik sinyalleri ve günlük akışı tek ekrandan izleyin.",
  },
  {
    src: "/assets/site-ici/pos-ekrani.png",
    title: "Reyon Görünümü",
    description: "Reyon düzeni, raf yerleşimi ve ürün konumlarını görsel olarak yönetin.",
  },
  {
    src: "/assets/site-ici/raporlama-ekrani.png",
    title: "Personel Yönetimi",
    description: "Personel, rol ve mağaza bazlı görev yönetimini düzenli şekilde takip edin.",
  },
  {
    src: "/assets/site-ici/operasyon-ekrani.png",
    title: "Ürün Takip Ekranı",
    description: "Ürün, kategori, stok ve fiyat bilgilerini operasyonel tablolarla izleyin.",
  },
] as const;

export function PricingShowcase() {
  return (
    <section className="section pricing-showcase-section">
      <Container>
        <SectionHeader
          align="center"
          description="Plan seçimi sonrasında Shelfio, mağaza ekiplerine operasyonlarını görsel ve düzenli şekilde takip edebilecekleri sade bir çalışma alanı sunar."
          eyebrow="Ürün görünümü"
          title="Shelfio ekranlarından operasyon görünümü"
        />
        <div className="pricing-showcase-grid">
          {showcaseItems.map((item) => (
            <Card className="pricing-showcase-card" key={item.src} padding="sm">
              <div className="pricing-showcase-card__media">
                <Image
                  alt={item.title}
                  height={909}
                  sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 560px"
                  src={item.src}
                  width={1904}
                />
              </div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
