import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { NotificationController } from "./notification.controller";

export function createNotificationRoutes(controller: NotificationController) {
  const router = new Hono();
  router.use("/*", authMiddleware);
  router.get("/", controller.list);
  router.get("/unread-count", controller.countUnread);
  router.patch("/:id/read", controller.markAsRead);
  router.patch("/read-all", controller.markAllAsRead);
  return router;
}
