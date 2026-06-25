import { createServer } from "node:http";
import { PORT } from "./server/config.mjs";
import { createRequestHandler } from "./server/routes.mjs";

const server = createServer(createRequestHandler());

server.listen(PORT, () => {
  console.log(`Skino storefront running at http://localhost:${PORT}/`);
  console.log(`Skino dashboard running at http://localhost:${PORT}/dashboard/`);
});
