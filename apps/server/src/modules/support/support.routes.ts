import { Hono } from "hono";
import type { SupportController } from "./support.controller";

export function createSupportRoutes(controller: SupportController) {
  const router = new Hono();
  router.post("/ticket", controller.submitTicket);
  router.post("/feedback", controller.submitFeedback);
  return router;
}
