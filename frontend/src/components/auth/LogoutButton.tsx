"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/services/authService";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await logout().catch(() => undefined);
    router.replace(routes.login);
    router.refresh();
  }

  return (
    <Button className={className} disabled={pending} onClick={handleLogout} type="button" variant="outline">
      {pending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
    </Button>
  );
}
