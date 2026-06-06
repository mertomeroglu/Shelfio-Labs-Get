import { query, type DbClient } from "../db/client.js";

export type CreateInvoiceInput = {
  amountCents: number;
  currency?: string;
  invoiceNumber: string;
  status?: string;
  subscriptionId?: string | null;
  tenantId: string;
};

export async function listInvoicesByTenant(tenantId: string, client: DbClient = { query }) {
  const result = await client.query("SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY issued_at DESC", [tenantId]);
  return result.rows;
}

export async function createInvoice(id: string, input: CreateInvoiceInput, client: DbClient = { query }) {
  const result = await client.query(
    `INSERT INTO invoices (id, tenant_id, subscription_id, invoice_number, amount_cents, currency, status, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 = 'paid' THEN now() ELSE null END)
     RETURNING *`,
    [
      id,
      input.tenantId,
      input.subscriptionId ?? null,
      input.invoiceNumber,
      input.amountCents,
      input.currency ?? "TRY",
      input.status ?? "issued",
    ],
  );
  return result.rows[0];
}
