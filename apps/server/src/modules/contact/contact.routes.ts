import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { ContactController } from "./contact.controller";

export function createContactRoutes(controller: ContactController) {
  const router = new Hono();

  // Public route (no auth)
  router.post("/", controller.submit);

  // Protected routes (auth required)
  router.get("/", authMiddleware, controller.list);
  router.patch("/:id/read", authMiddleware, controller.markAsRead);
  router.delete("/:id", authMiddleware, controller.delete);

  return router;
}
