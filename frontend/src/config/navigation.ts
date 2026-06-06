import type { FooterGroup, NavigationItem } from "@/types/navigation";
import { siteConfig } from "@/config/site";
import { routes } from "@/lib/routes";

export const primaryNavigation: NavigationItem[] = [
  { label: "Özellikler", href: routes.features },
  { label: "Fiyatlandırma", href: routes.pricing },
  { label: "Destek", href: routes.support },
];

export const accountNavigation: NavigationItem[] = [
  { label: "Hesabım", href: routes.account, icon: "user" },
  { label: "Lisanslar", href: routes.accountLicenses, icon: "license" },
  { label: "Lisans Aktivasyonu", href: routes.accountActivation, icon: "shield" },
  { label: "Fatura ve Ödeme", href: routes.accountBilling, icon: "billing" },
  { label: "Mağazalar", href: routes.accountStores, icon: "store" },
  { label: "Destek", href: routes.accountSupport, icon: "headset" },
  { label: "Ayarlar", href: routes.accountSettings, icon: "settings" },
];

export const adminNavigation: NavigationItem[] = [
  { label: "Dashboard", href: routes.admin, icon: "dashboard" },
  { label: "Lisanslar", href: routes.adminLicenses, icon: "license" },
  { label: "Lisans Üret", href: routes.adminLicenseCreate, icon: "plus" },
  { label: "Demo Talepleri", href: routes.adminDemoRequests, icon: "key" },
  { label: "Mağaza Talepleri", href: routes.adminStoreRequests, icon: "store" },
  { label: "Export Talepleri", href: routes.adminDataExports, icon: "key" },
  { label: "Destek", href: routes.adminSupport, icon: "headset" },
  { label: "Müşteriler", href: routes.adminCustomers, icon: "users" },
  { label: "Mail Gönder", href: routes.adminSendMail, icon: "email" },
  { label: "Ayarlar", href: routes.adminSettings, icon: "settings" },
];

export const footerNavigation: FooterGroup[] = [
  {
    title: "Ürün",
    items: [
      { label: "Özellikler", href: routes.features },
      { label: "Fiyatlandırma", href: routes.pricing },
      { label: "Demo", href: routes.demo },
    ],
  },
  {
    title: "Şirket",
    items: [
      { label: "Shelfio Labs", href: siteConfig.companyUrl },
      { label: "İletişim", href: routes.contact },
    ],
  },
  {
    title: "Destek",
    items: [
      { label: "Müşteri Portalı", href: routes.login },
      { label: "Destek Talebi", href: routes.support },
    ],
  },
  {
    title: "Yasal",
    items: [
      { label: "Gizlilik Politikası", href: routes.legalPrivacy },
      { label: "Kullanım Koşulları", href: routes.legalTerms },
      { label: "KVKK Aydınlatma Metni", href: routes.legalKvkk },
      { label: "Çerez Politikası", href: routes.legalCookies },
    ],
  },
];


