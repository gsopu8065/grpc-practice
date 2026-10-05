import fastify from "fastify";
import cors from "@fastify/cors";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import routes from "./routes.js";

const PORT = 8080;

async function main() {
  const server = fastify();

  // Browsers call this server from a different origin (the Vite dev server),
  // so we need to allow the Connect/gRPC-Web headers through CORS.
  await server.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Connect-Protocol-Version",
      "Connect-Timeout-Ms",
      "X-Grpc-Web",
      "X-User-Agent",
    ],
    exposedHeaders: [
      "Grpc-Status",
      "Grpc-Message",
      "Grpc-Status-Details-Bin",
    ],
  });

  await server.register(fastifyConnectPlugin, { routes });

  server.get("/", (_req, reply) => {
    reply.send("GreetService is running over gRPC, gRPC-Web, and Connect.");
  });

  await server.listen({ host: "localhost", port: PORT });
  console.log(`Backend listening on http://localhost:${PORT}`);
}

void main();
