import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "Shelfio hizmet sitesi KVKK aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <section className="page-shell legal-page">
      <Container className="page-shell__inner legal-page__inner">
        <p className="eyebrow">Yasal</p>
        <h1>KVKK Aydınlatma Metni</h1>
        <p>
          Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında get.shelfio hizmet
          sitesi üzerinden işlenen kişisel verilere ilişkin bilgilendirme amacıyla hazırlanmıştır.
        </p>
        <div className="legal-content">
          <h2>Kişisel Verilerin Korunması Hakkında Aydınlatma Metni</h2>
          <p>
            İşbu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca,
            veri sorumlusu sıfatıyla hareket eden Shelfio Stok Takip ve Elektronik Etiket Sistemleri
            Teknoloji A.Ş. tarafından, Shelfio platformunu kullanan kullanıcılar, personeller, tedarikçi
            yetkilileri ve ilgili kişiler bakımından kişisel verilerin işlenmesine ilişkin usul ve
            esaslar hakkında bilgilendirme amacıyla hazırlanmıştır.
          </p>
          <p>
            Shelfio; küçük ve orta ölçekli mağazalar için geliştirilen, mağaza operasyonlarının tek bir
            platform üzerinden yönetilmesini amaçlayan bir yazılım altyapısıdır. Platform kapsamında;
            ürün yönetimi, stok yönetimi, satın alma ve tedarik süreçleri, POS/kasa işlemleri,
            operasyon görevleri, raporlama, elektronik raf etiketi yönetimi, kullanıcı yönetimi, sistem
            ayarları ve analiz süreçleri yürütülebilmektedir.
          </p>

          <h2>1. Veri Sorumlusu</h2>
          <p>
            KVKK uyarınca kişisel verileriniz, veri sorumlusu olarak Shelfio Stok Takip ve Elektronik
            Etiket Sistemleri Teknoloji A.Ş. tarafından işlenebilecektir. İletişim: Kazımdirik, 372.
            Sk. · info@getshelfio.com
          </p>

          <h2>2. İşlenen Kişisel Veriler</h2>
          <p>Shelfio platformunun kullanımı sırasında aşağıdaki kişisel veriler işlenebilmektedir:</p>
          <ul>
            <li>Kimlik ve kullanıcı bilgileri: ad soyad, kullanıcı adı ve hesap tanımlayıcıları.</li>
            <li>İletişim bilgileri: telefon numarası ve e-posta adresi.</li>
            <li>Mesleki ve organizasyonel bilgiler: rol, yetki, mağaza, şube ve kullanıcı tipi bilgileri.</li>
            <li>İşlem ve kullanım kayıtları: oturum, işlem, teknik log ve sistem içi kullanım kayıtları.</li>
          </ul>

          <h2>3. Toplama Yöntemleri</h2>
          <p>
            Kişisel verileriniz; web sitesi, web yönetim paneli, mobil uygulama, kullanıcı kayıt ve
            giriş ekranları, sistem içi formlar, görev ve operasyon modülleri, satın alma, stok ve ürün
            yönetimi ekranları, POS/kasa modülleri, elektronik raf etiketi entegrasyonları, teknik log
            mekanizmaları, çerezler ve destek kanalları üzerinden elektronik ortamda toplanabilir.
          </p>

          <h2>4. İşleme Amaçları</h2>
          <p>
            Veriler; platform hizmetlerinin yürütülmesi, kullanıcı hesaplarının yönetilmesi, mağaza
            operasyonlarının planlanması, stok, tedarik, POS, raporlama ve görev süreçlerinin
            işletilmesi, destek taleplerinin yönetilmesi, güvenlik ve denetim süreçlerinin yürütülmesi
            amacıyla işlenebilir.
          </p>

          <h2>5. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri</h2>
          <p>
            Kişisel verileriniz, KVKK’nın 5. maddesinde belirtilen veri işleme şartlarına dayanılarak
            işlenmektedir. Bu kapsamda; sözleşmenin kurulması veya ifası, veri sorumlusunun hukuki
            yükümlülüğünü yerine getirebilmesi, bir hakkın tesisi, kullanılması veya korunması, meşru
            menfaat ve açık rıza hukuki sebepleri uygulanabilir.
          </p>

          <h2>6. Kişisel Verilerin Aktarılması</h2>
          <p>
            Kişisel verileriniz, işleme amaçlarının yerine getirilebilmesi doğrultusunda; kanunen
            yetkili kamu kurum ve kuruluşları, hukuken yetkili özel kişi veya kuruluşlar, teknik
            altyapı, bakım, destek, güvenlik ve yazılım hizmeti sunan iş ortakları veya hizmet
            sağlayıcılarla sınırlı ve ölçülü şekilde paylaşılabilir.
          </p>

          <h2>7. Saklama Süresi ve Haklarınız</h2>
          <p>
            Kişisel verileriniz, ilgili mevzuatta öngörülen süreler boyunca veya işlendikleri amaç için
            gerekli olan süre kadar saklanır. Saklama süresi sona eren kişisel veriler ilgili mevzuata
            uygun olarak silinir, yok edilir veya anonim hale getirilir. KVKK’nın 11. maddesi
            kapsamındaki haklarınızı kullanmak için Shelfio Labs iletişim kanalları üzerinden başvuruda
            bulunabilirsiniz.
          </p>

          <h2>Açık Rıza Metni</h2>
          <p>
            İşbu Açık Rıza Metni, Shelfio Stok Takip ve Elektronik Etiket Sistemleri Teknoloji A.Ş.
            tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, belirli veri işleme
            faaliyetlerine ilişkin açık rızanızın alınması amacıyla hazırlanmıştır.
          </p>
          <p>
            Shelfio tarafından sunulan hizmetler kapsamında, temel platform hizmetlerinin dışında kalan
            bazı bildirim, kampanya, pazarlama ve kişiselleştirilmiş iletişim süreçlerinde telefon
            numarası, e-posta adresi, kampanya izin bilgileri ve lokasyon / yakınlık verisi
            işlenebilmektedir.
          </p>
          <p>Kişisel verileriniz aşağıdaki amaçlarla işlenebilir:</p>
          <ul>
            <li>Kampanya, fırsat ve bilgilendirme içeriklerinin iletilmesi.</li>
            <li>Size özel bildirimlerin gönderilmesi.</li>
            <li>Mağaza yakınlığınıza göre bilgilendirme yapılması.</li>
            <li>Kişiselleştirilmiş kullanıcı deneyimi sunulması.</li>
            <li>Tanıtım ve iletişim süreçlerinin yürütülmesi.</li>
          </ul>
          <p>
            Açık rızanın verilmesi tamamen özgür iradenize bağlıdır. Vermiş olduğunuz açık rızayı
            dilediğiniz zaman geri alabilirsiniz. Bu metni onaylayarak, yukarıda belirtilen kişisel
            verilerimin belirtilen amaçlarla işlenmesine açık rıza verdiğimi kabul ederim.
          </p>
        </div>
      </Container>
    </section>
  );
}
