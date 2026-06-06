import "dotenv/config";
import { getPool } from "./client.js";
import { seedDefaults } from "../repositories/controlRepository.js";

seedDefaults()
  .then(async () => {
    process.stdout.write("Seed completed\n");
    await getPool().end();
  })
  .catch(async (error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    await getPool().end().catch(() => undefined);
    process.exitCode = 1;
  });
