"use client";

import { useEffect, useState } from "react";
import type { CurrentUser } from "@/types/tenant";
import { getCurrentUser } from "@/services/authService";

export function PortalSessionCard({
  fallbackName,
  roleLabel,
}: {
  fallbackName: string;
  roleLabel: "Admin" | "Müşteri";
}) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    void getCurrentUser().then(setUser);
  }, []);

  const displayName = user?.name || user?.email || fallbackName;
  const companyName = user?.tenant?.name || "Şirket bilgisi bekleniyor";

  return (
    <div className="portal-user-card">
      <div>
        <strong title={displayName}>{displayName}</strong>
        <small title={companyName}>{companyName}</small>
      </div>
      <b>{roleLabel}</b>
    </div>
  );
}
