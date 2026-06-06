"use client";

import { useEffect, useState } from "react";
import { startPanelAccess } from "@/services/panelAccessService";
import { getAccountOverview } from "@/services/accountService";
import { Button } from "@/components/ui/Button";

export function PanelAccessButton({
  children = "Shelfio sistemine git",
  disabled = false,
  variant,
  licenseStatus,
  activationStatus,
}: {
  children?: string;
  disabled?: boolean;
  variant?: "primary" | "outline";
  licenseStatus?: string;
  activationStatus?: string;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchedStatus, setFetchedStatus] = useState<string | null>(null);
  const [fetchedActivation, setFetchedActivation] = useState<string | null>(null);

  useEffect(() => {
    if (!licenseStatus) {
      void getAccountOverview()
        .then((overview) => {
          setFetchedStatus(overview.licenseStatus);
          setFetchedActivation(overview.hasActiveLicense ? "Aktif" : "Aktivasyon bekliyor");
        })
        .catch(() => {});
    }
  }, [licenseStatus]);

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const result = await startPanelAccess();
      window.location.assign(result.redirectUrl);
    } catch (caught) {
      const msg = caught instanceof Error ? caught.message : "Lisans bulunamadı. Lütfen destek ekibiyle iletişime geçin.";
      setError(msg);
      setLoading(false);
    }
  }

  const status = licenseStatus || fetchedStatus;
  const activation = activationStatus || fetchedActivation;

  let buttonText = children;
  let isButtonDisabled = disabled || loading;

  if (status === "pending" || activation === "Aktivasyon bekliyor") {
    buttonText = "Önce lisansınızı aktive edin.";
    isButtonDisabled = true;
  } else if (status === "expired" || status === "revoked" || status === "cancelled") {
    isButtonDisabled = true;
  } else if (!status) {
    isButtonDisabled = true;
  } else if (status !== "active") {
    isButtonDisabled = true;
  }

  return (
    <span className="panel-access-button">
      <Button disabled={isButtonDisabled} onClick={() => void handleClick()} type="button" variant={variant}>
        {loading ? "Geçiş hazırlanıyor..." : buttonText}
      </Button>
      {error ? <small className="panel-access-alert" role="alert" style={{ display: "block", color: "var(--danger-color, #ef4444)", marginTop: "0.25rem" }}>{error}</small> : null}
    </span>
  );
}


