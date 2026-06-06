import "dotenv/config";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPool } from "./client.js";

const migrationDir = [join(__dirname, "migrations"), join(process.cwd(), "src", "db", "migrations")].find((dir) =>
  existsSync(dir),
);

async function migrate() {
  if (!migrationDir) {
    throw new Error("Migration directory was not found");
  }

  const pool = getPool();
  let pendingCount = 0;
  let lockAcquired = false;
  const client = await pool.connect();

  try {
    const files = (await readdir(migrationDir)).filter((file) => file.endsWith(".sql")).sort();

    await client.query("SELECT pg_advisory_lock(hashtext('shelfio_service_schema_migrations'))");
    lockAcquired = true;
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );

    for (const file of files) {
      const applied = await client.query("SELECT 1 FROM schema_migrations WHERE id = $1", [file]);
      if (applied.rowCount) continue;

      pendingCount += 1;

      await client.query("BEGIN");
      try {
        await client.query(await readFile(join(migrationDir, file), "utf8"));
        await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
        await client.query("COMMIT");
        process.stdout.write(`Applied migration ${file}\n`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    if (pendingCount === 0) {
      process.stdout.write("No pending migrations\n");
    }
  } finally {
    try {
      if (lockAcquired) {
        await client.query("SELECT pg_advisory_unlock(hashtext('shelfio_service_schema_migrations'))");
      }
    } finally {
      client.release();
      await pool.end();
    }
  }
}

migrate().catch((error) => {
  process.stderr.write(`Migration failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
