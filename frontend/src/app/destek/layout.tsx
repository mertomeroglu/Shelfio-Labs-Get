import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Destek",
};

export default function DestekLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
