import type { Metadata } from "next";
import { AdminPasswordSettingsForm } from "@/components/admin/AdminPasswordSettingsForm";
import { AdminPageHeader } from "@/components/admin/AdminUi";

export const metadata: Metadata = {
  title: "Admin Ayarları",
};

export default function AdminSettingsPage() {
  return (
    <>
      <AdminPageHeader
        description="Admin hesabınızın güvenlik bilgilerini yönetin."
        title="Admin Ayarları"
      />
      <AdminPasswordSettingsForm />
    </>
  );
}
