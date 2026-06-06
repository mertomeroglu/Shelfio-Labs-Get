import { routes } from "@/lib/routes";

export const heroSignals = [
  "Depo + reyon stok ayrımı",
  "POS bağlantılı stok düşümü",
  "B2B satın alma akışı",
  "Lisanslı güvenli erişim",
  "Sipariş önerileri",
  "Rol bazlı kullanım",
] as const;

export const heroStats = [
  { label: "Toplam stok", value: "18.420", tone: "primary" },
  { label: "Kritik stok", value: "34", tone: "warning" },
  { label: "Bekleyen sipariş", value: "12", tone: "accent" },
  { label: "Günlük satış", value: "₺48.760", tone: "success" },
] as const;

export const problemCards = [
  "Depo ve reyon stoku birbirine karışır.",
  "Hangi üründen ne kadar sipariş verileceği netleşmez.",
  "Kasa satışı, stok ve satın alma ayrı ayrı takip edilir.",
  "Tedarikçi siparişleri dağınık ilerler.",
  "Personel görevleri ve mağaza içi operasyonlar görünmez kalır.",
] as const;

export const solutionCards = [
  "Depo + reyon stok ayrımı",
  "POS ile otomatik stok düşümü",
  "Satış hızına göre sipariş önerileri",
  "Tedarikçi ve satın alma yönetimi",
  "Görev, bildirim ve raporlama akışları",
] as const;

export const homeModules = [
  {
    icon: "ST",
    title: "Stok Takip",
    meta: "Depo + reyon",
    description: "Depo, reyon ve toplam stok seviyelerini tek panelden izleyin.",
  },
  {
    icon: "POS",
    title: "POS / Kasa",
    meta: "Satış akışı",
    description: "Satış, iade, ödeme ve stok düşümünü aynı akışta yönetin.",
  },
  {
    icon: "SA",
    title: "Tedarik & Satın Alma",
    meta: "B2B sipariş",
    description: "Tedarikçi, MOQ, koli/adet ve teslim süresi bilgileriyle gerçekçi sipariş oluşturun.",
  },
  {
    icon: "SÖ",
    title: "Sipariş Önerileri",
    meta: "Akıllı eşik",
    description: "Satış hızı, stok seviyesi ve tedarik süresine göre ürün bazlı öneriler alın.",
  },
  {
    icon: "DR",
    title: "Depo & Reyon Yönetimi",
    meta: "Operasyon",
    description: "Raf kapasitesi, depo lokasyonu ve reyon taleplerini operasyonel olarak takip edin.",
  },
  {
    icon: "RP",
    title: "Raporlama",
    meta: "Karar verisi",
    description: "Satış, stok, fiyat ve kampanya verilerini karar aldıran raporlara dönüştürün.",
  },
  {
    icon: "ESL",
    title: "ESL / Etiket Yönetimi",
    meta: "Etiket akışı",
    description: "Elektronik raf etiketi, şablon, ürün eşleşmesi ve gönderim geçmişini yönetin.",
  },
  {
    icon: "MO",
    title: "Mobil Operasyon",
    meta: "Saha ekipleri",
    description: "Personel görevleri, mobil sipariş ve saha operasyon deneyimini destekleyin.",
  },
] as const;

export const workflowSteps = [
  { icon: "layers", title: "Paket seç", description: "İşletme ölçeğine uygun planı belirleyin." },
  { icon: "file-text", title: "Demo veya satın alma", description: "Demo talebi oluşturun ya da paket başvurusuna devam edin." },
  { icon: "key", title: "Lisans hazırlanır", description: "Hesabınıza uygun lisans akışı güvenli şekilde başlatılır." },
  { icon: "store", title: "Mağaza aktif edilir", description: "Mağaza ve kullanıcı bilgileri doğrulanır." },
  { icon: "shield-check", title: "Güvenli giriş", description: "Panel erişimi lisans ve role göre açılır." },
  { icon: "workflow", title: "Operasyonu yönetin", description: "Stok, kasa ve tedarik akışlarını tek panelden izleyin." },
] as const;

export const dashboardTasks = [
  { label: "Reyon 3 içecek rafı tamamlanacak", status: "Bugün" },
  { label: "Tedarikçi siparişi onay bekliyor", status: "Beklemede" },
  { label: "Kritik stok ürünleri kontrol edildi", status: "Tamamlandı" },
] as const;

export const landingPlans = [
  {
    name: "Başlangıç",
    price: "1 TL / ay",
    description: "Temel stok, ürün ve kasa akışını tek mağaza için sade şekilde başlatır.",
    highlighted: false,
    features: ["Dashboard", "Ürünler", "Kategoriler", "POS / Kasa", "Stok İşlemleri", "Bildirimler"],
  },
  {
    name: "Profesyonel",
    price: "2 TL / ay",
    description: "Depo, reyon, tedarik, görev ve mobil operasyonları aynı ticari akışta toplar.",
    highlighted: true,
    features: [
      "Lokasyon Yönetimi",
      "SKT Takibi",
      "Depo Transfer Talepleri",
      "Görev Planlama",
      "Raporlar",
      "Sipariş Önerileri",
    ],
  },
  {
    name: "Kurumsal",
    price: "3 TL / ay",
    description: "Çoklu mağaza, rol/yetki, ESL ve entegrasyon hazırlığı olan yapılar için kurgulanır.",
    highlighted: false,
    features: [
      "Taleplerim & Erişim",
      "Kampanya Yönetimi",
      "Proximity Yönetimi",
      "Etiket Yönetimi",
      "Personel Mobil",
    ],
  },
] as const;

export const securityItems = [
  { icon: "key", label: "Lisans anahtarı ile aktivasyon" },
  { icon: "shield-check", label: "Rol bazlı erişim" },
  { icon: "users", label: "Mağaza ve kullanıcı bazlı yetki" },
  { icon: "external-link", label: "Güvenli panel yönlendirmesi" },
  { icon: "database", label: "POS, stok ve satın alma verilerinde kontrollü erişim" },
  { icon: "layout-dashboard", label: "Türkçe arayüz ve operasyon odaklı yapı" },
] as const;

export const homeCtas = {
  demo: routes.demo,
  pricing: routes.pricing,
  activate: routes.activationLogin,
  login: routes.login,
} as const;
