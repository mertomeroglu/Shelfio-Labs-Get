"use client";

import { useEffect, useState } from "react";
import type { AccountInvoice, BillingSummary } from "@/types/account";
import { AccountPageHeader, StatusBadge } from "@/components/account/AccountUi";
import { getBillingSummary, getInvoices } from "@/services/accountService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";

export default function AccountBillingPage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<AccountInvoice[]>([]);

  useEffect(() => {
    void Promise.all([getBillingSummary(), getInvoices()]).then(([nextSummary, nextInvoices]) => {
      setSummary(nextSummary);
      setInvoices(nextInvoices);
    });
  }, []);

  return (
    <>
      <AccountPageHeader
        description="Planınızla ilişkili fatura ve ödeme özetlerini takip edin."
        eyebrow="Faturalandırma"
        title="Fatura ve Ödeme"
      />
      {summary ? (
        <div className="account-metric-grid account-billing-summary-grid">
          <Summary
            label="Mevcut plan"
            value={summary.planName}
            icon="shield"
            iconColor="var(--color-primary)"
          />
          <Summary
            label="Fatura durumu"
            value={
              summary.invoiceStatus ? (
                <StatusBadge status={summary.invoiceStatus} type="invoice" />
              ) : (
                "Henüz fatura bulunmuyor."
              )
            }
            icon="billing"
            iconColor={summary.invoiceStatus === "paid" ? "var(--color-success)" : "var(--color-warning)"}
          />
          <Summary
            label="Son ödeme tarihi"
            value={summary.latestPaymentAt ?? "Kayıtlı ödeme bulunmuyor"}
            icon="license"
            iconColor="#8b5cf6"
          />
          <Summary
            label="Ödeme yöntemi"
            value={summary.paymentMethodLabel ?? "Kayıtlı ödeme yöntemi yok"}
            icon="key"
            iconColor="#ec4899"
          />
        </div>
      ) : null}
      <div className="account-section-heading">
        <h2>Fatura Geçmişi</h2>
        <p>Satın alma ve yenileme kayıtlarınızı buradan takip edebilirsiniz.</p>
      </div>
      <div className="account-list account-invoice-list">
        {invoices.length === 0 ? (
          <Card className="empty-state-card premium-empty-state" padding="lg">
            <div className="empty-state-icon-wrapper">
              <Icon name="billing" style={{ width: 24, height: 24 }} />
            </div>
            <h3>Henüz Fatura Bulunmuyor</h3>
            <p>Satın alma veya yenileme işlemi oluştuğunda fatura detaylarınız ve geçmişiniz burada güvenle listelenecektir.</p>
          </Card>
        ) : null}
        {invoices.map((invoice) => (
          <Card className="account-list-row" key={invoice.id} padding="sm">
            <div>
              <strong>{invoice.description}</strong>
              <span>
                {invoice.date} · #{invoice.id}
              </span>
            </div>
            <span>{invoice.amountLabel}</span>
            <StatusBadge status={invoice.status} type="invoice" />
            <Button disabled size="sm" variant="outline">
              Görüntüle
            </Button>
          </Card>
        ))}
      </div>
    </>
  );
}

function Summary({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: React.ReactNode;
  icon: IconName;
  iconColor: string;
}) {
  return (
    <Card className="account-metric-card premium-metric" padding="md">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <div className="metric-icon-wrapper" style={{ color: iconColor, backgroundColor: `${iconColor}15` }}>
          <Icon name={icon} />
        </div>
      </div>
      <div className="metric-body">
        {typeof value === "string" ? (
          <strong className="metric-value">{value}</strong>
        ) : (
          <div className="metric-badge-wrapper">{value}</div>
        )}
      </div>
    </Card>
  );
}


