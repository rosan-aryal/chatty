import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { ChatController } from "./chat.controller";

export function createChatRoutes(controller: ChatController) {
  const router = new Hono();
  router.use("/*", authMiddleware);
  router.get("/groups/:groupId/messages", controller.getGroupMessages);
  router.get("/friends/:friendshipId/messages", controller.getFriendMessages);
  return router;
}
