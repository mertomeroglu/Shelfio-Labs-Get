"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CurrentUser } from "@/types/tenant";
import { getCurrentUser } from "@/services/authService";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type AuthState = "loading" | "guest" | "customer" | "admin";

export function ActivationAccessGate({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    let active = true;

    void getCurrentUser().then((user: CurrentUser | null) => {
      if (!active) return;
      if (!user) setAuthState("guest");
      else setAuthState(user.role === "admin" ? "admin" : "customer");
    });

    return () => {
      active = false;
    };
  }, []);

  if (authState === "loading") {
    return (
      <Card className="activation-login-required" padding="lg">
        <p>Oturum durumu kontrol ediliyor.</p>
      </Card>
    );
  }

  if (authState === "guest") {
    return (
      <Card className="activation-login-required" padding="lg">
        <h2>Lisans aktivasyonu için giriş yapmanız gerekmektedir.</h2>
        <Button href={routes.login} size="lg">
          Giriş Yap
        </Button>
      </Card>
    );
  }

  if (authState === "admin") {
    return (
      <Card className="activation-login-required" padding="lg">
        <h2>Lisans aktivasyonu müşteri hesabı ile yapılır.</h2>
        <Button href={routes.adminLicenses} size="lg" variant="outline">
          Admin lisanslarına dön
        </Button>
      </Card>
    );
  }

  return children;
}
