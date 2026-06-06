const fs = require("fs");
const path = require("path");
let Pool;
try {
  ({ Pool } = require("pg"));
} catch {
  ({ Pool } = require(path.join(__dirname, "../../backend/node_modules/pg")));
}

const CONFIRM_TEXT = "CLEAN_GETSHELFIO";
const args = new Set(process.argv.slice(2));
const isApply = args.has("--apply");
const confirmValue = process.argv[process.argv.indexOf("--confirm") + 1];

loadEnv(path.join(__dirname, "../../backend/.env"));

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!key || process.env[key]) continue;
    process.env[key.trim()] = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

function maskEmail(value) {
  if (!value || !value.includes("@")) return "-";
  const [name, domain] = value.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskText(value) {
  if (!value) return "-";
  return String(value).length > 24 ? `${String(value).slice(0, 24)}...` : String(value);
}

async function count(client, sql, params = []) {
  const result = await client.query(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function sample(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

function printSamples(title, rows, formatter) {
  console.log(`\n${title}`);
  if (!rows.length) {
    console.log("  - No sample records.");
    return;
  }
  for (const row of rows) console.log(`  - ${formatter(row)}`);
}

async function assertSafeToApply(client) {
  const adminTenantResult = await client.query(
    "SELECT id, email, tenant_id FROM users WHERE role = 'admin' AND tenant_id IS NOT NULL AND deleted_at IS NULL",
  );
  if (adminTenantResult.rowCount) {
    console.error("manual review required: at least one admin user is attached to a tenant that may be cleaned.");
    console.error("Detach or review admin tenant ownership before running cleanup.");
    process.exitCode = 1;
    return false;
  }
  return true;
}

async function main() {
  console.log("==================================================================");
  console.log("          GETSHELFIO CUSTOMER DATA CLEANUP");
  console.log("==================================================================");
  console.log(isApply ? "Mode: APPLY" : "Mode: DRY-RUN");

  if (isApply && confirmValue !== CONFIRM_TEXT) {
    console.error(`\nRefusing to apply. Use: --apply --confirm ${CONFIRM_TEXT}`);
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not configured.");
    process.exit(1);
  }

  if (isApply) {
    console.log("\nBACKUP REQUIRED BEFORE APPLY:");
    console.log("  pg_dump \"$DATABASE_URL\" > getshelfio-backup-before-cleanup.sql");
    console.log("Cleanup will run inside one transaction and roll back on error.\n");
  } else {
    console.log("\nNo data will be deleted in dry-run mode.");
    console.log(`Apply command: node scripts/cleanup/cleanupGetshelfioData.js --apply --confirm ${CONFIRM_TEXT}\n`);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });
  const client = await pool.connect();

  try {
    if (!(await assertSafeToApply(client))) return;

    const customerUsersWhere = "role = 'customer' AND deleted_at IS NULL";
    const customerTenantIdsSql = "SELECT DISTINCT tenant_id FROM users WHERE role = 'customer' AND tenant_id IS NOT NULL AND deleted_at IS NULL";
    const counts = {
      customers: await count(client, `SELECT count(*) FROM users WHERE ${customerUsersWhere}`),
      customerUsers: await count(client, `SELECT count(*) FROM users WHERE ${customerUsersWhere}`),
      tenants: await count(client, `SELECT count(*) FROM tenants WHERE id IN (${customerTenantIdsSql})`),
      licenses: await count(client, "SELECT count(*) FROM licenses"),
      demoRequests: await count(client, "SELECT count(*) FROM demo_requests"),
      supportTickets: await count(client, "SELECT count(*) FROM support_tickets"),
      supportMessages: await count(client, "SELECT count(*) FROM support_messages sm JOIN support_tickets st ON st.id = sm.ticket_id"),
      panelAccessCodes: await count(client, "SELECT count(*) FROM panel_access_codes"),
      relatedAuditRows: await count(
        client,
        `SELECT count(*) FROM audit_logs
         WHERE tenant_id IN (${customerTenantIdsSql})
            OR actor_user_id IN (SELECT id FROM users WHERE role = 'customer')
            OR resource_type IN ('license', 'support_ticket', 'panel_access_code', 'demo_request')`,
      ),
    };

    console.log("Records selected for cleanup:");
    for (const [key, value] of Object.entries(counts)) console.log(`  - ${key}: ${value}`);

    printSamples(
      "Customer samples",
      await sample(client, "SELECT id, email, full_name FROM users WHERE role = 'customer' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 5"),
      (row) => `${maskText(row.full_name)} | ${maskEmail(row.email)} | ${row.id}`,
    );
    printSamples(
      "Tenant samples",
      await sample(client, `SELECT id, name FROM tenants WHERE id IN (${customerTenantIdsSql}) ORDER BY created_at DESC LIMIT 5`),
      (row) => `${maskText(row.name)} | ${row.id}`,
    );
    printSamples(
      "License samples",
      await sample(client, "SELECT id, masked_key, masked_license_key, issued_to_email FROM licenses ORDER BY created_at DESC LIMIT 5"),
      (row) => `${row.masked_key || row.masked_license_key || "masked"} | ${maskEmail(row.issued_to_email)} | ${row.id}`,
    );
    printSamples(
      "Demo request samples",
      await sample(client, "SELECT id, business_name, email FROM demo_requests ORDER BY created_at DESC LIMIT 5"),
      (row) => `${maskText(row.business_name)} | ${maskEmail(row.email)} | ${row.id}`,
    );
    printSamples(
      "Support ticket samples",
      await sample(client, "SELECT id, subject, customer_email FROM support_tickets ORDER BY created_at DESC LIMIT 5"),
      (row) => `${maskText(row.subject)} | ${maskEmail(row.customer_email)} | ${row.id}`,
    );

    if (!isApply) {
      console.log("\nDRY-RUN COMPLETE: no changes were applied.");
      return;
    }

    await client.query("BEGIN");
    try {
      await client.query("DELETE FROM support_messages");
      await client.query("DELETE FROM support_tickets");
      await client.query("DELETE FROM panel_access_codes");
      await client.query("DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE role = 'customer')");
      await client.query("DELETE FROM payments WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM users WHERE role = 'customer' AND tenant_id IS NOT NULL)");
      await client.query("DELETE FROM invoices WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM users WHERE role = 'customer' AND tenant_id IS NOT NULL)");
      await client.query("DELETE FROM subscriptions WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM users WHERE role = 'customer' AND tenant_id IS NOT NULL)");
      await client.query("DELETE FROM license_plan_changes WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM users WHERE role = 'customer' AND tenant_id IS NOT NULL)");
      await client.query("DELETE FROM demo_requests");
      await client.query(
        `DELETE FROM audit_logs
         WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM users WHERE role = 'customer' AND tenant_id IS NOT NULL)
            OR actor_user_id IN (SELECT id FROM users WHERE role = 'customer')
            OR resource_type IN ('license', 'support_ticket', 'panel_access_code', 'demo_request')`,
      );
      await client.query("DELETE FROM licenses");
      await client.query("UPDATE tenants SET owner_user_id = NULL WHERE owner_user_id IN (SELECT id FROM users WHERE role = 'customer')");
      await client.query("DELETE FROM users WHERE role = 'customer'");
      await client.query("DELETE FROM tenants WHERE id NOT IN (SELECT tenant_id FROM users WHERE tenant_id IS NOT NULL)");
      await client.query("COMMIT");
      console.log("\nAPPLY COMPLETE: cleanup committed successfully.");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("\nAPPLY FAILED: transaction rolled back.");
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
