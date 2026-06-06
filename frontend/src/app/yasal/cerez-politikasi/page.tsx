import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "Shelfio hizmet sitesi çerez politikası.",
};

export default function CookiePolicyPage() {
  return (
    <section className="page-shell legal-page">
      <Container className="page-shell__inner legal-page__inner">
        <p className="eyebrow">Yasal</p>
        <h1>Çerez Politikası</h1>
        <p>
          Bu politika, get.shelfio hizmet sitesinde kullanılan çerez ve benzeri teknolojilere ilişkin
          temel bilgileri açıklar.
        </p>
        <div className="legal-content">
          <h2>Çerezlerin Kullanım Amaçları</h2>
          <p>
            Çerezler; web sitesinin güvenli ve kararlı çalışmasını sağlamak, oturum ve tercih
            bilgilerini yönetmek, sayfa performansını ölçmek ve kullanıcı deneyimini iyileştirmek için
            kullanılabilir.
          </p>

          <h2>Çerez Türleri</h2>
          <ul>
            <li>Zorunlu çerezler: Sitenin temel işlevlerinin çalışması için gereklidir.</li>
            <li>Performans çerezleri: Sayfa yüklenme ve kullanım performansını anlamaya yardımcı olur.</li>
            <li>Analitik çerezler: Ziyaret ve kullanım istatistiklerinin ölçümlenmesini sağlar.</li>
            <li>Tercih çerezleri: Dil, görünüm ve benzeri tercihlerin hatırlanmasına yardımcı olur.</li>
          </ul>

          <h2>Çerez Yönetimi</h2>
          <p>
            Tarayıcı ayarlarınız üzerinden çerezleri silebilir, engelleyebilir veya tercihlerinizi
            değiştirebilirsiniz. Ayrıntılı çerez yönetimi paneli ilerleyen sürümlerde hizmet sitesine
            eklenebilir.
          </p>
        </div>
      </Container>
    </section>
  );
}
