import type { Metadata } from "next";
import { PricingCards } from "@/components/marketing/PricingCards";
import { PricingComparison } from "@/components/marketing/PricingComparison";
import { PricingFlowFaq } from "@/components/marketing/PricingFlowFaq";
import { PricingHero } from "@/components/marketing/PricingHero";
import { PricingShowcase } from "@/components/marketing/PricingShowcase";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description:
    "Shelfio planlarını, modül erişimlerini ve demo/teklif akışını inceleyin. Gerçek fiyatlar demo ve kurulum sürecinden sonra netleşir.",
};

export default function PricingPage() {
  return (
    <>
      <PricingHero />
      <PricingCards />
      <PricingShowcase />
      <PricingComparison />
      <PricingFlowFaq />
    </>
  );
}
