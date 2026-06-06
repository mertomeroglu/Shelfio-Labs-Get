import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Giriş",
  description: "get.shelfio müşteri, kayıt ve admin erişim ekranı.",
};

type LoginPageProps = {
  searchParams?: Promise<{
    mode?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <section className="login-page">
      <Container className="login-page__inner">
        <div className="login-page__copy">
          <p className="eyebrow">Shelfio Erişim Kapısı</p>
          <h1>Shelfio hesabınıza güvenli erişim.</h1>
          <p>
            Lisans, aktivasyon ve müşteri portalı işlemlerinizi net bir akışla yönetin.
            Müşteri hesabı, yeni kayıt ve yetkili admin erişimi aynı güvenli giriş kapısında buluşur.
          </p>
          <div className="login-page__highlights" aria-label="Erişim akışı">
            <span>Müşteri portalı</span>
            <span>Hesap oluşturma</span>
            <span>Admin lisans yönetimi</span>
            <span>Aktivasyon yönlendirmesi</span>
          </div>
        </div>
        <Suspense fallback={<div className="auth-choice auth-choice--loading" />}>
          <LoginForm
            initialModeParam={params?.mode}
            nextPath={params?.next}
          />
        </Suspense>
      </Container>
    </section>
  );
}
