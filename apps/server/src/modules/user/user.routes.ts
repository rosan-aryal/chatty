import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { UserController } from "./user.controller";

export function createUserRoutes(controller: UserController) {
  const router = new Hono();
  router.use("/*", authMiddleware);
  router.get("/profile", controller.getProfile);
  router.patch("/onboard", controller.onboard);
  router.patch("/visibility", controller.updateVisibility);
  return router;
}
