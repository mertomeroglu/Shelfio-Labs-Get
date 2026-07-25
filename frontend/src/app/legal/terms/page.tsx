import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Kullanim Kosullari",
  description: "GetShelfio hizmet sitesi kullanim kosullari.",
};

export default function TermsPage() {
  return (
    <section className="page-shell legal-page">
      <Container className="page-shell__inner legal-page__inner">
        <p className="eyebrow">Yasal</p>
        <h1>Kullanim Kosullari</h1>
        <p>
          Bu sayfa, GetShelfio public portfolio surumu icin genel kullanim notlarini icerir. Canli
          production yayini icin bolgeye, urune ve sozlesme modeline uygun profesyonel hukuki metinler
          ayrica hazirlanmalidir.
        </p>
        <div className="legal-content">
          <h2>1. Hizmetin Kapsami</h2>
          <p>
            GetShelfio; demo talebi, paket bilgilendirme, lisans aktivasyonu, musteri portali ve destek
            is akislari icin gelistirilen Shelfio servis yuzeyidir. Repository icindeki bazi odeme,
            SSO ve entegrasyon ozellikleri prototip veya entegrasyon bagimli olabilir.
          </p>

          <h2>2. Kullanici Sorumlulugu</h2>
          <p>
            Kullanicilar hesap bilgilerini korumak, sisteme dogru bilgi girmek ve hizmeti hukuka uygun
            sekilde kullanmakla sorumludur. Yetkisiz erisim denemeleri, sistem guvenligini zayiflatan
            islemler ve verilerin izinsiz kopyalanmasi yasaktir.
          </p>

          <h2>3. Hizmet Surekliligi</h2>
          <p>
            Bu public repository production hizmet garantisi vermez. Canli kullanim icin izleme, yedekleme,
            hata yonetimi, guvenli secret yonetimi ve deployment surecleri ayrica yapilandirilmalidir.
          </p>

          <h2>4. Fikri Mulkiyet</h2>
          <p>
            Shelfio adi, arayuzleri, kaynak kodu ve ilgili varliklar hak sahiplerine aittir. Public repo
            gorunurlugu acik kaynak lisansi anlamina gelmez. Kullanim sinirlari icin repository kokundeki
            LICENSE dosyasina bakin.
          </p>

          <h2>5. Iletisim</h2>
          <p>
            Guvenlik aciklarini public issue olarak paylasmayin. Genel iletisim icin{" "}
            <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a> adresini kullanin.
          </p>
        </div>
      </Container>
    </section>
  );
}
