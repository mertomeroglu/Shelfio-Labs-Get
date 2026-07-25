function getHostname(url: string) {
  return new URL(url).hostname;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://getshelfio.com";
const companyUrl = process.env.NEXT_PUBLIC_COMPANY_SITE_URL || "https://shelfiolabs.com/";
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";

export const siteConfig = {
  siteName: "get.shelfio",
  productName: "Shelfio",
  companyName: "Shelfio Labs",
  description:
    "GetShelfio is the service site and customer portal surface for Shelfio demo requests, package information, license activation, support, and account workflows.",
  siteUrl,
  siteDomain: getHostname(siteUrl),
  companyUrl,
  companyDomain: getHostname(companyUrl),
  supportEmail,
  appUrl: process.env.NEXT_PUBLIC_SHELFIO_APP_URL ?? "https://shelfiolabs.com/",
} as const;
