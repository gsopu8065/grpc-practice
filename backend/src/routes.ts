import type { ConnectRouter } from "@connectrpc/connect";
import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { GreetService } from "./gen/greet/v1/greet_pb.js";
import { TimeService } from "./gen/time/v1/time_pb.js";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A real gRPC client (HTTP/2, not the Connect protocol) to the separate
// TimeService process. The frontend never sees this — it only calls
// GreetService once, and this backend fans that single call out to
// another service over gRPC.
const timeClient = createClient(
  TimeService,
  createGrpcTransport({ baseUrl: "http://localhost:8081" }),
);

export default (router: ConnectRouter) =>
  router.service(GreetService, {
    async sayHello(req) {
      const { isoTime } = await timeClient.getTime({});
      return { greeting: `Hello, ${req.name}! (server time: ${isoTime})` };
    },

    async *sayHelloStream(req) {
      const words = `Hello , ${req.name} , welcome , to , gRPC !`.split(" , ");
      for (const word of words) {
        await sleep(400);
        yield { greeting: word };
      }
    },
  });
