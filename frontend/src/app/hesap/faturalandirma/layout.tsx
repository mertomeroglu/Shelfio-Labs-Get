import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Fatura ve Ödeme",
};

export default function AccountBillingLayout({ children }: { children: ReactNode }) {
  return children;
}
