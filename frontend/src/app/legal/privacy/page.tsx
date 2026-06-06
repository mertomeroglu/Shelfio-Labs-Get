import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Shelfio hizmet sitesi gizlilik politikası.",
};

export default function PrivacyPage() {
  return (
    <section className="page-shell legal-page">
      <Container className="page-shell__inner legal-page__inner">
        <p className="eyebrow">Yasal</p>
        <h1>Gizlilik Politikası</h1>
        <p>
          Bu politika, get.shelfio hizmet sitesi üzerinden paylaşılan demo, iletişim, aktivasyon ve
          destek bilgilerine ilişkin temel gizlilik yaklaşımını açıklar.
        </p>
        <div className="legal-content">
          <h2>Toplanan Bilgiler</h2>
          <p>
            Demo talebi, destek talebi ve aktivasyon formlarında ad soyad, e-posta, telefon, işletme
            adı, mağaza bilgileri ve ilgili mesaj içerikleri alınabilir. Bu bilgiler talebin
            değerlendirilmesi, geri dönüş yapılması ve hizmet sürecinin planlanması amacıyla kullanılır.
          </p>

          <h2>Kullanım Amaçları</h2>
          <p>
            Paylaşılan bilgiler; talep yönetimi, müşteri iletişimi, lisans aktivasyon ön hazırlığı,
            ürün geliştirme sinyallerinin değerlendirilmesi ve yasal yükümlülüklerin yerine getirilmesi
            kapsamında işlenebilir.
          </p>

          <h2>Paylaşım ve Güvenlik</h2>
          <p>
            Kişisel veriler yetkisiz kişilerle paylaşılmaz. Hizmetin yürütülmesi için gerekli olduğu
            ölçüde teknik altyapı sağlayıcıları, iş ortakları veya yetkili kurumlarla mevzuata uygun
            şekilde paylaşım yapılabilir.
          </p>

          <h2>Saklama ve Başvuru</h2>
          <p>
            Veriler işleme amacı için gerekli süre boyunca saklanır. İlgili kişiler, kişisel verilerine
            ilişkin taleplerini şirket iletişim kanalları üzerinden iletebilir.
          </p>
        </div>
      </Container>
    </section>
  );
}
