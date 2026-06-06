import type { Metadata } from "next";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { FinalCta } from "@/components/marketing/FinalCta";
import { HomeHero } from "@/components/marketing/HomeHero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ModuleGrid } from "@/components/marketing/ModuleGrid";
import { ProblemSolution } from "@/components/marketing/ProblemSolution";
import { PricingPreview } from "@/components/marketing/PricingPreview";
import { SecurityTrust } from "@/components/marketing/SecurityTrust";

export const metadata: Metadata = {
  title: {
    absolute: "Anasayfa | GetShelfio",
  },
};

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <ProblemSolution />
      <ModuleGrid />
      <HowItWorks />
      <DashboardPreview />
      <PricingPreview />
      <SecurityTrust />
      <FinalCta />
    </>
  );
}
