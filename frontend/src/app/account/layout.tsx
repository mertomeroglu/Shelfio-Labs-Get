import type { Metadata } from "next";
import { PortalNavigation } from "@/components/account/PortalNavigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { PortalSessionCard } from "@/components/auth/PortalSessionCard";
import { Container } from "@/components/ui/Container";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hesabım",
};

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="account-shell">
      <Container className="account-shell__inner">
        <aside className="account-sidebar">
          <h2>Müşteri Portalı</h2>
          <p>Hizmet hesabınız</p>
          <PortalNavigation />
          <PortalSessionCard fallbackName="Müşteri" roleLabel="Müşteri" />
          <LogoutButton className="portal-logout button--destructive" />
        </aside>
        <div className="account-content">{children}</div>
      </Container>
    </section>
  );
}
