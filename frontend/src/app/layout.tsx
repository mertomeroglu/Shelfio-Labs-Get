import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { siteConfig } from "@/config/site";
import { CanonicalHostRedirect } from "@/components/layout/CanonicalHostRedirect";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: "Anasayfa | GetShelfio",
    template: "%s | GetShelfio",
  },
  description: siteConfig.description,
  icons: {
    icon: "/assets/brand/favicon.png",
  },
  openGraph: {
    title: "Anasayfa | GetShelfio",
    description: siteConfig.description,
    siteName: siteConfig.siteName,
    type: "website",
    url: siteConfig.siteUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={inter.variable} lang="tr">
      <body>
        <CanonicalHostRedirect />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
