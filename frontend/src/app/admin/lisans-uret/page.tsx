import type { Metadata } from "next";
import { LicenseCreateForm } from "@/components/admin/LicenseCreateForm";
import { AdminPageHeader } from "@/components/admin/AdminUi";

export const metadata: Metadata = {
  title: "Lisans Üret",
};

export default function AdminLicenseCreatePage() {
  return (
    <>
      <AdminPageHeader
        description="Kayıtlı müşteriye veya manuel müşteri bilgileriyle güvenli biçimde lisans oluşturun."
        title="Lisans Üret"
      />
      <LicenseCreateForm />
    </>
  );
}
