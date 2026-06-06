import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Shelfio hizmet sitesi kullanım koşulları.",
};

export default function TermsPage() {
  return (
    <section className="page-shell legal-page">
      <Container className="page-shell__inner legal-page__inner">
        <p className="eyebrow">Yasal</p>
        <h1>Kullanım Koşulları</h1>
        <p>
          İşbu Şartlar ve Koşullar metni, Shelfio Stok Takip ve Elektronik Etiket Sistemleri
          Teknoloji A.Ş. tarafından sunulan Shelfio platformunun kullanımına ilişkin esasları
          düzenlemektedir. Platformu kullanan her kullanıcı, işbu şartları kabul etmiş sayılır.
        </p>
        <div className="legal-content">
          <h2>1. Hizmetin Kapsamı</h2>
          <p>
            Shelfio, küçük ve orta ölçekli mağazalara yönelik geliştirilen bir mağaza operasyon
            platformudur. Platform kapsamında; ürün yönetimi, stok yönetimi, POS / kasa işlemleri,
            tedarik ve satın alma süreçleri, operasyon görevleri, raporlama, elektronik raf etiketi
            yönetimi, kullanıcı yönetimi, sistem ayarları ve ilgili diğer operasyonel hizmetler
            sunulabilir.
          </p>
          <p>
            Shelfio, hizmet kapsamını geliştirme, güncelleme, değiştirme, genişletme veya bazı
            modülleri kaldırma hakkını saklı tutar.
          </p>

          <h2>2. Kullanım Koşulları</h2>
          <p>
            Kullanıcılar, platformu yalnızca hukuka uygun amaçlarla ve hizmetin niteliğine uygun
            şekilde kullanmayı kabul eder. Kullanıcı, Shelfio üzerinde oluşturduğu veya sisteme girdiği
            bilgilerin doğru, güncel ve gerektiğinde yetkili olduğu kapsamda kullanıldığını kabul eder.
          </p>
          <p>
            Kullanıcı hesabı, kullanıcıya özeldir. Hesap bilgilerinin ve giriş bilgilerinin
            korunmasından kullanıcı sorumludur. Yetkisiz kullanım şüphesi doğuran durumlarda kullanıcı,
            durumu gecikmeksizin Shelfio’ya bildirmelidir.
          </p>

          <h2>3. Yasaklı Kullanımlar</h2>
          <p>Aşağıdaki kullanım biçimleri yasaktır:</p>
          <ul>
            <li>Platforma yetkisiz erişim sağlamaya çalışmak.</li>
            <li>Sistemin güvenliğini zayıflatacak işlemler yapmak.</li>
            <li>Yanlış, yanıltıcı veya hukuka aykırı veri girişi yapmak.</li>
            <li>Hizmetin çalışmasını bozacak veya aksatacak teknik işlemler yürütmek.</li>
            <li>Başka kullanıcıların hesaplarına yetkisiz erişmeye çalışmak.</li>
            <li>Platformu mevzuata aykırı şekilde kullanmak.</li>
            <li>Sistemde yer alan içerik, veri veya yazılım unsurlarını izinsiz kopyalamak, çoğaltmak veya kötüye kullanmak.</li>
          </ul>

          <h2>4. Kullanıcı Sorumluluğu</h2>
          <p>
            Kullanıcı, Shelfio platformunu kullanımından doğan işlemlerden kendi yetki ve sorumluluk
            alanı kapsamında sorumludur. Kullanıcı tarafından yapılan işlemler, güvenlik, denetim,
            hizmet sürekliliği ve operasyon takibi amacıyla kayıt altına alınabilir.
          </p>

          <h2>5. Hizmet Sürekliliği ve Değişiklik Hakkı</h2>
          <p>
            Shelfio, hizmetlerini sürekli ve güvenli şekilde sunmak için gerekli teknik önlemleri
            almaya çalışır. Bununla birlikte, bakım, güncelleme, teknik arıza, altyapı değişikliği,
            güvenlik gereklilikleri veya mücbir sebepler nedeniyle hizmette geçici kesintiler
            yaşanabilir.
          </p>

          <h2>6. Fikri Mülkiyet</h2>
          <p>
            Shelfio platformuna ait yazılım, tasarım, arayüz, marka, logo, sistem yapısı, metinler,
            görseller, teknik unsurlar ve diğer tüm içerikler Shelfio Stok Takip ve Elektronik Etiket
            Sistemleri Teknoloji A.Ş.’ye veya ilgili hak sahiplerine aittir. Kullanıcılar, bu içerikleri
            önceden yazılı izin olmaksızın kopyalayamaz, çoğaltamaz, dağıtamaz, ticari amaçla
            kullanamaz veya tersine mühendislik faaliyetlerine konu edemez.
          </p>

          <h2>7. Kişisel Veriler</h2>
          <p>
            Platformun kullanımı sırasında kişisel veriler, ilgili mevzuata uygun olarak işlenebilir.
            Kişisel verilerin işlenmesine ilişkin detaylı bilgi, Kişisel Verilerin Korunması Hakkında
            Aydınlatma Metni ve gerektiğinde Açık Rıza Metni içerisinde yer almaktadır.
          </p>

          <h2>8. Sorumluluğun Sınırlandırılması</h2>
          <p>
            Shelfio, platformun kesintisiz, hatasız veya her özel ihtiyaca tamamen uygun şekilde
            çalışacağını garanti etmez. Platform, mevcut haliyle sunulmaktadır.
          </p>

          <h2>9. Uygulanacak Hukuk ve Yetki</h2>
          <p>
            İşbu Şartlar ve Koşullar metni Türkiye Cumhuriyeti hukuku kapsamında yorumlanır ve
            uygulanır. Taraflar arasında doğabilecek uyuşmazlıklarda ilgili mevzuat hükümleri
            çerçevesinde yetkili mahkeme ve icra daireleri esas alınır.
          </p>

          <h2>10. İletişim</h2>
          <p>
            Shelfio Stok Takip ve Elektronik Etiket Sistemleri Teknoloji A.Ş. · Kazımdirik, 372. Sk. ·
            info@getshelfio.com
          </p>
        </div>
      </Container>
    </section>
  );
}
