import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 4017);

createApp().listen(port, () => {
  process.stdout.write(`shelfio-service-api listening on http://localhost:${port}\n`);
});
