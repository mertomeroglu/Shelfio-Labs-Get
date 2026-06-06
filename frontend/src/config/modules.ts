export type FeatureModule = {
  slug: string;
  title: string;
  shortTitle: string;
  icon: string;
  meta: string;
  description: string;
  benefits: string[];
  mockup: {
    label: string;
    value: string;
    details: string[];
  };
};

export const featureModules: FeatureModule[] = [
  {
    slug: "stok-takip",
    title: "Stok Takip",
    shortTitle: "Stok",
    icon: "ST",
    meta: "Depo + reyon",
    description: "Depo, reyon ve toplam stok seviyelerini tek panelden izleyin.",
    benefits: [
      "Depo stoku, reyon stoku ve toplam stok ayrımı",
      "Kritik stok takibi",
      "Raf kapasitesi görünürlüğü",
      "Stok hareket geçmişi",
      "Ürün birimi, koli ve paket ayrımı",
    ],
    mockup: {
      label: "Kritik stok",
      value: "34 ürün",
      details: ["Depo: 18", "Reyon: 16", "Sipariş önerisi: 12"],
    },
  },
  {
    slug: "pos-kasa",
    title: "POS / Kasa",
    shortTitle: "POS",
    icon: "POS",
    meta: "Satış akışı",
    description: "Satış, iade, ödeme ve stok düşümünü aynı akışta yönetin.",
    benefits: [
      "Ürün ve barkod arama",
      "Satış ve iade akışı",
      "Satış sonrası stok düşümü",
      "Ödeme ve fiş çıktısı hazırlığı",
      "Kasa operasyonu görünürlüğü",
    ],
    mockup: {
      label: "Günlük satış",
      value: "₺48.760",
      details: ["İade: 3", "Fiş: 216", "Stok düşümü: otomatik"],
    },
  },
  {
    slug: "depo-reyon",
    title: "Depo & Reyon Yönetimi",
    shortTitle: "Depo/Reyon",
    icon: "DR",
    meta: "Raf operasyonu",
    description: "Raf kapasitesi, depo lokasyonu ve reyon taleplerini operasyonel olarak takip edin.",
    benefits: [
      "Depo lokasyonları",
      "Reyon kapasitesi",
      "Reyon transfer talepleri",
      "Raf doluluk takibi",
      "Depo operasyon görünürlüğü",
    ],
    mockup: {
      label: "Reyon doluluk",
      value: "%82",
      details: ["Transfer talebi: 7", "Bekleyen raf: 4", "Lokasyon: A-12"],
    },
  },
  {
    slug: "tedarik-satin-alma",
    title: "Tedarik & Satın Alma",
    shortTitle: "Tedarik",
    icon: "SA",
    meta: "B2B sipariş",
    description: "Tedarikçi, MOQ, koli/adet ve teslim süresi bilgileriyle gerçekçi sipariş oluşturun.",
    benefits: [
      "Tedarikçi yönetimi",
      "Katalogdan sipariş",
      "MOQ takibi",
      "Teslim süresi görünürlüğü",
      "Koli/adet dönüşümü",
      "Mal kabul akışı",
    ],
    mockup: {
      label: "Bekleyen satın alma",
      value: "8 sipariş",
      details: ["Tedarikçi: 3", "MOQ kontrolü: açık", "Mal kabul: bugün"],
    },
  },
  {
    slug: "siparis-onerileri",
    title: "Sipariş Önerileri",
    shortTitle: "Öneri",
    icon: "SÖ",
    meta: "Akıllı eşik",
    description: "Satış hızı, stok seviyesi ve tedarik süresine göre ürün bazlı öneriler alın.",
    benefits: [
      "Satış hızı sinyali",
      "Kritik stok kontrolü",
      "Lead time dikkate alma",
      "MOQ ile uyumlu öneri",
      "Varsayılan tedarikçi eşleşmesi",
      "Koli içi adet hesabı",
    ],
    mockup: {
      label: "Önerilen sipariş",
      value: "128 adet",
      details: ["Satış hızı: yüksek", "Lead time: 4 gün", "Koli: 12 adet"],
    },
  },
  {
    slug: "fiyat-talep-analizi",
    title: "Fiyat & Talep Analizi",
    shortTitle: "Analiz",
    icon: "FT",
    meta: "Karar sinyali",
    description: "Ürün bazlı fiyat aksiyonlarını, talep sinyallerini ve risk seviyesini takip edin.",
    benefits: [
      "Ürün bazlı fiyat aksiyonları",
      "Talep sinyalleri",
      "Fiyat geçmişi",
      "Risk seviyesi",
      "Kontrollü fiyat güncelleme hazırlığı",
    ],
    mockup: {
      label: "Talep riski",
      value: "Orta",
      details: ["Fiyat değişimi: %4", "Talep: artıyor", "Aksiyon: incele"],
    },
  },
  {
    slug: "kampanya-yonetimi",
    title: "Kampanya Yönetimi",
    shortTitle: "Kampanya",
    icon: "KY",
    meta: "Kategori/marka",
    description: "Ürün, kategori ve marka bazlı kampanyaları operasyon verisiyle birlikte izleyin.",
    benefits: [
      "Kampanya önerileri",
      "Ürün/kategori/marka bazlı kampanyalar",
      "Hediye kartı akışları",
      "Kampanya performansı",
      "Arşiv takibi",
    ],
    mockup: {
      label: "Aktif kampanya",
      value: "12",
      details: ["Kategori: içecek", "Performans: izleniyor", "Arşiv: açık"],
    },
  },
  {
    slug: "raporlama",
    title: "Raporlama",
    shortTitle: "Rapor",
    icon: "RP",
    meta: "Karar verisi",
    description: "Satış, stok, fiyat ve kampanya verilerini karar aldıran raporlara dönüştürün.",
    benefits: [
      "Satış raporları",
      "Stok raporları",
      "Tedarik görünürlüğü",
      "Kampanya etkisi",
      "POS ve gün sonu özetleri",
      "Operasyon kararları",
    ],
    mockup: {
      label: "Gün sonu",
      value: "Hazır",
      details: ["Satış: toplandı", "Stok: eşleşti", "Aksiyon: 5 öneri"],
    },
  },
  {
    slug: "gorev-planlama",
    title: "Görev Planlama",
    shortTitle: "Görev",
    icon: "GP",
    meta: "Personel",
    description: "Personel görevlerini, bildirimleri ve tamamlanma durumunu operasyon planına bağlayın.",
    benefits: [
      "Personel görevleri",
      "Rol bazlı görünürlük",
      "Bildirimler",
      "Tamamlama takibi",
      "Operasyon planı",
    ],
    mockup: {
      label: "Bugünkü görev",
      value: "18",
      details: ["Tamamlanan: 11", "Bekleyen: 7", "Rol: reyon ekibi"],
    },
  },
  {
    slug: "esl-etiket",
    title: "ESL / Etiket Yönetimi",
    shortTitle: "ESL",
    icon: "ESL",
    meta: "Etiket akışı",
    description: "Elektronik raf etiketi, şablon, ürün eşleşmesi ve gönderim geçmişini yönetin.",
    benefits: [
      "Elektronik raf etiketi cihazları",
      "Şablon yönetimi",
      "Ürün eşleştirme",
      "Etiket önizleme",
      "Gönderim geçmişi",
    ],
    mockup: {
      label: "Etiket gönderimi",
      value: "246",
      details: ["Eşleşen: 238", "Bekleyen: 8", "Şablon: raf fiyatı"],
    },
  },
  {
    slug: "personel-mobil",
    title: "Personel Mobil",
    shortTitle: "Personel",
    icon: "PM",
    meta: "Saha ekipleri",
    description: "Görev, etiket, sipariş ve lokasyon işlemlerini mobil ekip akışına taşıyın.",
    benefits: [
      "Görevler",
      "Etiket işlemleri",
      "Sipariş oluşturma",
      "Lokasyon görünürlüğü",
      "Reyon talep akışı",
    ],
    mockup: {
      label: "Mobil görev",
      value: "7 açık",
      details: ["Reyon talebi: 3", "Etiket: 2", "Sipariş: 2"],
    },
  },
];

export const operationFlow = [
  "Ürün",
  "Stok",
  "POS satışı",
  "Stok düşümü",
  "Sipariş önerisi",
  "Satın alma",
  "Mal kabul",
  "Reyon transferi",
  "Raporlama",
] as const;

export const featureAudiences = [
  "Tek mağazalı marketler",
  "Büyüyen yerel zincirler",
  "Depo + reyon takibi yapan mağazalar",
  "Tedarikçi siparişi düzenli olan işletmeler",
  "Personel görev takibi isteyen mağazalar",
  "ESL kullanan veya kullanmayı planlayan mağazalar",
] as const;

export const modules = featureModules;
