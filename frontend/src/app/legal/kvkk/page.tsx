import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "KVKK Bilgilendirme Notu",
  description: "GetShelfio public portfolio surumu icin kisisel veri bilgilendirme notu.",
};

export default function KvkkPage() {
  return (
    <section className="page-shell legal-page">
      <Container className="page-shell__inner legal-page__inner">
        <p className="eyebrow">Yasal</p>
        <h1>KVKK Bilgilendirme Notu</h1>
        <p>
          Bu sayfa, GetShelfio public portfolio surumunde hangi tur verilerin islenebilecegini aciklayan
          genel bir bilgilendirme notudur. Production kullanim icin hukuki danismanlikla hazirlanmis
          resmi KVKK metinleri kullanilmalidir.
        </p>
        <div className="legal-content">
          <h2>Islenebilecek Veriler</h2>
          <p>
            Demo talebi, destek talebi, hesap acma, lisans aktivasyonu ve portal kullaniminda ad soyad,
            e-posta, telefon, isletme adi, magaza bilgileri, destek mesaji, oturum ve islem kayitlari
            islenebilir.
          </p>

          <h2>Isleme Amaclari</h2>
          <p>
            Veriler talep yonetimi, musteri iletisimi, lisans ve hesap islemleri, destek surecleri,
            guvenlik denetimi ve servis iyilestirmeleri icin kullanilabilir.
          </p>

          <h2>Paylasim</h2>
          <p>
            Veriler yetkisiz kisilerle paylasilmamalidir. Canli kullanimda teknik altyapi saglayicilari,
            yasal merciler veya gerekli is ortaklariyla paylasim ancak mevzuata uygun sekilde yapilmalidir.
          </p>

          <h2>Haklar ve Iletisim</h2>
          <p>
            Kisisel verilerle ilgili talepler ve guvenlik bildirimleri icin{" "}
            <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a> adresi kullanilabilir.
            Guvenlik aciklarini public issue olarak paylasmayin.
          </p>
        </div>
      </Container>
    </section>
  );
}
