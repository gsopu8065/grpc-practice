import type { ConnectRouter } from "@connectrpc/connect";
import { TimeService } from "./gen/time/v1/time_pb.js";

export default (router: ConnectRouter) =>
  router.service(TimeService, {
    async getTime() {
      return { isoTime: new Date().toISOString() };
    },
  });
