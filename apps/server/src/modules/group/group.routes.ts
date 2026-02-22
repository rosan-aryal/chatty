import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { GroupController } from "./group.controller";

export function createGroupRoutes(controller: GroupController) {
  const router = new Hono();
  router.use("/*", authMiddleware);
  router.post("/", controller.create);
  router.get("/public", controller.listPublic);
  router.get("/mine", controller.listMyGroups);
  router.get("/:id", controller.getById);
  router.post("/:id/join", controller.joinPublic);
  router.post("/join-code", controller.joinByCode);
  router.post("/:id/leave", controller.leave);
  router.post("/:id/kick", controller.kick);
  router.delete("/:id", controller.deleteGroup);
  router.post("/:id/regenerate-code", controller.regenerateCode);
  router.post("/:id/ban", controller.ban);
  router.post("/:id/unban", controller.unban);
  router.get("/:id/bans", controller.listBans);
  return router;
}
