import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { FriendshipController } from "./friendship.controller";

export function createFriendshipRoutes(controller: FriendshipController) {
  const router = new Hono();
  router.use("/*", authMiddleware);
  router.post("/request", controller.sendRequest);
  router.patch("/:id/accept", controller.acceptRequest);
  router.patch("/:id/reject", controller.rejectRequest);
  router.delete("/:id", controller.removeFriend);
  router.get("/", controller.listFriends);
  router.get("/pending", controller.listPending);
  return router;
}
