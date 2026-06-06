import "dotenv/config";
import { getPool } from "../db/client.js";
import { ensureCorePlans } from "../repositories/controlRepository.js";

async function runRepair() {
  process.stdout.write("Running idempotent plan matrix repair...\n");
  await ensureCorePlans();
  process.stdout.write("Repair completed successfully.\n");
}

runRepair()
  .then(async () => {
    await getPool().end();
  })
  .catch(async (error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    await getPool().end().catch(() => undefined);
    process.exitCode = 1;
  });
