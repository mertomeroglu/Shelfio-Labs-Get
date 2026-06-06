import { createServer } from "node:http";
import { routeRequest } from "./routes/router.js";

export function createApp() {
  return createServer(routeRequest);
}
