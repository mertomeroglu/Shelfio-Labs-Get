import { query, type DbClient } from "../db/client.js";

export type CreateSupportTicketInput = {
  customerUserId: string;
  priority?: string;
  subject: string;
  tenantId: string;
};

export async function listSupportTicketsByTenant(tenantId: string, client: DbClient = { query }) {
  const result = await client.query("SELECT * FROM support_tickets WHERE tenant_id = $1 ORDER BY updated_at DESC", [tenantId]);
  return result.rows;
}

export async function createSupportTicket(id: string, input: CreateSupportTicketInput, client: DbClient = { query }) {
  const result = await client.query(
    `INSERT INTO support_tickets (id, tenant_id, customer_user_id, subject, module, priority, status)
     VALUES ($1, $2, $3, $4, 'Genel', $5, 'Yeni')
     RETURNING *`,
    [id, input.tenantId, input.customerUserId, input.subject, input.priority ?? "Orta"],
  );
  return result.rows[0];
}

export async function addSupportMessage(
  id: string,
  input: { authorRole: "customer" | "admin" | "support"; authorUserId: string; body: string; ticketId: string },
  client: DbClient = { query },
) {
  const result = await client.query(
    `INSERT INTO support_messages (id, ticket_id, author_user_id, author_role, body)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, input.ticketId, input.authorUserId, input.authorRole, input.body],
  );
  return result.rows[0];
}
