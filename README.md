# gRPC Practice

A minimal gRPC learning project:

- [`proto/`](proto/) — the shared service contracts: `GreetService` (a unary `SayHello` RPC and a server-streaming `SayHelloStream` RPC) and `TimeService` (a unary `GetTime` RPC).
- [`backend/`](backend/) — Node.js + TypeScript + Fastify, using [Connect](https://connectrpc.com/) (`@connectrpc/connect-fastify`). It serves real gRPC, gRPC-Web, and the Connect protocol on the same port — no separate proxy needed.
- [`frontend/`](frontend/) — Vite + TypeScript browser app that calls the backend directly using `@connectrpc/connect-web`.
- [`time-service/`](time-service/) — a second, internal backend. It's only ever called by `backend`, over **real gRPC** (HTTP/2, cleartext) — the frontend never talks to it. See [Service-to-service gRPC](#service-to-service-grpc) below.

## Prerequisites

- Node.js 20+
- No global installs needed — `buf` and `protoc-gen-es` run via `npx`/npm scripts.

## Build

Install dependencies for all three packages, then generate the TypeScript code from the `.proto` file:

```bash
npm install                         # root: installs buf + protoc-gen-es
npm run generate                    # generates backend/src/gen, frontend/src/gen, time-service/src/gen

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd time-service && npm install && cd ..
```

Re-run `npm run generate` from the root whenever you edit anything under `proto/`.

To type-check without running anything:

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
cd time-service && npx tsc --noEmit
```

## Run

Start all three in separate terminals (order doesn't matter, but `time-service` should be up before you click "Say Hello" in the browser):

```bash
cd time-service && npm run dev  # internal gRPC server on http://localhost:8081
cd backend && npm run dev       # gRPC/Connect server on http://localhost:8080
cd frontend && npm run dev      # browser app on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173), type a name, and click either button:

- **Say Hello (unary)** — one request, one response. Under the hood, `backend` also makes a real gRPC call to `time-service` to fetch a timestamp and includes it in the greeting (see below).
- **Say Hello (streaming)** — one request, a stream of responses rendered as they arrive.

## Service-to-service gRPC

This is the part that's easy to miss when you only ever call a backend from a browser: **real gRPC requires HTTP/2 with trailers, which browsers can't do directly** — that's why the frontend talks to `backend` using the Connect protocol instead (see `frontend/src/main.ts`). But backend-to-backend calls have no such restriction, so `backend` talks to `time-service` using an actual gRPC client.

The frontend still only ever makes **one call** (`GreetService.SayHello`). That single call fans out into a second RPC internally:

```
frontend  --(Connect protocol, HTTP/1.1)-->  backend  --(real gRPC, HTTP/2)-->  time-service
(browser)                                    :8080                             :8081
```

- [`backend/src/routes.ts`](backend/src/routes.ts) creates a gRPC client with `createGrpcTransport` from `@connectrpc/connect-node` and calls `TimeService.GetTime` inside its `sayHello` handler.
- [`time-service/src/server.ts`](time-service/src/server.ts) serves `TimeService` over plain `node:http2` — cleartext HTTP/2 (h2c), which is fine for internal, unencrypted service-to-service traffic on localhost.
- The frontend has no proto/client code for `TimeService` at all — it's invisible to the browser by construction, not just by convention.

## Test

There's no formal test suite here — this is a learning sandbox — but you can exercise both RPCs directly.

**Unary call, via curl** (with both `time-service` and `backend` running):

```bash
curl -s -X POST http://localhost:8080/greet.v1.GreetService/SayHello \
  -H "Content-Type: application/json" \
  -d '{"name":"World"}'
# {"greeting":"Hello, World! (server time: 2026-09-28T20:28:23.030Z)"}
```

The embedded timestamp is proof the call reached `time-service` and back — if you stop `time-service` and try again, this call fails instead of falling back silently.

**Streaming call**, using the real Connect-Web client (curl can't easily speak the enveloped streaming wire format, so use a small script). From `frontend/`:

```bash
cat > /tmp/test-stream.mjs << 'EOF'
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { GreetService } from "./src/gen/greet/v1/greet_pb.js";

const client = createClient(GreetService, createConnectTransport({ baseUrl: "http://localhost:8080" }));
for await (const res of client.sayHelloStream({ name: "World" })) {
  process.stdout.write(res.greeting + " ");
}
console.log();
EOF
npx tsx /tmp/test-stream.mjs
```

**In the browser**: open the dev tools Network tab while clicking the buttons — you'll see the unary call as a single POST, and the streaming call as a chunked response that keeps growing.
