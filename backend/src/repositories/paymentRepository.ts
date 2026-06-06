import { query, type DbClient } from "../db/client.js";

export type CreatePaymentInput = {
  amountCents: number;
  currency?: string;
  invoiceId?: string | null;
  provider: string;
  providerPaymentId: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  tenantId: string;
};

export async function listPaymentsByTenant(tenantId: string, client: DbClient = { query }) {
  const result = await client.query("SELECT * FROM payments WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId]);
  return result.rows;
}

export async function createPayment(id: string, input: CreatePaymentInput, client: DbClient = { query }) {
  const result = await client.query(
    `INSERT INTO payments (id, tenant_id, invoice_id, provider, provider_payment_id, amount_cents, currency, status, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $8 = 'succeeded' THEN now() ELSE null END)
     RETURNING *`,
    [
      id,
      input.tenantId,
      input.invoiceId ?? null,
      input.provider,
      input.providerPaymentId,
      input.amountCents,
      input.currency ?? "TRY",
      input.status,
    ],
  );
  return result.rows[0];
}
