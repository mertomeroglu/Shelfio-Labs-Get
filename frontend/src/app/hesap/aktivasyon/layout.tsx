import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aktivasyon",
};

export default function AktivasyonLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
