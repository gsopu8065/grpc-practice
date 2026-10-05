import * as http2 from "node:http2";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import routes from "./routes.js";

const PORT = 8081;

// Plain cleartext HTTP/2 (h2c) — this is real gRPC, not the Connect
// protocol. It's only ever called by the "backend" service, never by
// a browser, so it doesn't need CORS or TLS for local learning purposes.
const server = http2.createServer(connectNodeAdapter({ routes }));

server.listen(PORT, () => {
  console.log(`TimeService listening on http://localhost:${PORT} (gRPC over h2c)`);
});
