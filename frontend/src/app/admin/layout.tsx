import type { Metadata } from "next";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { PortalSessionCard } from "@/components/auth/PortalSessionCard";
import { Container } from "@/components/ui/Container";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Panel",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="account-shell admin-shell">
      <Container className="account-shell__inner">
        <aside className="account-sidebar">
          <h2>Admin Portal</h2>
          <p>Shelfio hizmet yönetimi</p>
          <AdminNavigation />
          <PortalSessionCard fallbackName="Admin" roleLabel="Admin" />
          <LogoutButton className="portal-logout button--destructive" />
        </aside>
        <div className="account-content">{children}</div>
      </Container>
    </section>
  );
}
