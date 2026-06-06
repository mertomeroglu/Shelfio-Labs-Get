function getHostname(url: string) {
  return new URL(url).hostname;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://getshelfio.com";
const companyUrl = process.env.NEXT_PUBLIC_COMPANY_SITE_URL || "https://shelfiolabs.com/";

export const siteConfig = {
  siteName: "get.shelfio",
  productName: "Shelfio",
  companyName: "Shelfio Labs",
  description:
    "GetShelfio, Shelfio lisans, aktivasyon, destek ve müşteri portalı süreçlerini güvenli şekilde yönetmek için tasarlanmış hizmet platformudur.",
  siteUrl,
  siteDomain: getHostname(siteUrl),
  companyUrl,
  companyDomain: getHostname(companyUrl),
  supportEmail: "info@getshelfio.com",
  appUrl: process.env.NEXT_PUBLIC_SHELFIO_APP_URL ?? "https://shelfiolabs.com/",
} as const;
