import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mağazalarım",
};

export default function AccountStoresLayout({ children }: { children: ReactNode }) {
  return children;
}
