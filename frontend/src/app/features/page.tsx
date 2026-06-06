import type { Metadata } from "next";
import { AudienceSection } from "@/components/marketing/AudienceSection";
import { FeatureDetailSection } from "@/components/marketing/FeatureDetailSection";
import { FeatureOverviewGrid } from "@/components/marketing/FeatureOverviewGrid";
import { FeaturesHero } from "@/components/marketing/FeaturesHero";
import { OperationFlow } from "@/components/marketing/OperationFlow";

export const metadata: Metadata = {
  title: "Özellikler",
  description:
    "Shelfio stok, POS, depo-reyon, tedarik, sipariş, raporlama, ESL ve mobil operasyon modüllerini tek sistemde birleştirir.",
};

export default function FeaturesPage() {
  return (
    <>
      <FeaturesHero />
      <FeatureOverviewGrid />
      <OperationFlow />
      <FeatureDetailSection />
      <AudienceSection />
    </>
  );
}
