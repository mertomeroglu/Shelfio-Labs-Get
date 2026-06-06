import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Şifre Belirle",
};

export default function ResetPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
