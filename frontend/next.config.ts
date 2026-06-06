import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      { source: "/features", destination: "/ozellikler", permanent: true },
      { source: "/pricing", destination: "/fiyatlandirma", permanent: true },
      { source: "/activate", destination: "/aktivasyon", permanent: true },
      { source: "/login", destination: "/giris", permanent: true },
      { source: "/account", destination: "/hesap", permanent: true },
      { source: "/account/licenses", destination: "/hesap/lisanslar", permanent: true },
      { source: "/account/billing", destination: "/hesap/faturalandirma", permanent: true },
      { source: "/account/stores", destination: "/hesap/magazalar", permanent: true },
      { source: "/account/support", destination: "/hesap/destek", permanent: true },
      { source: "/legal/terms", destination: "/yasal/kullanim-kosullari", permanent: true },
      { source: "/legal/privacy", destination: "/yasal/gizlilik-politikasi", permanent: true },
      { source: "/legal/kvkk", destination: "/yasal/kvkk-aydinlatma-metni", permanent: true },
    ];
  },
};

export default nextConfig;
