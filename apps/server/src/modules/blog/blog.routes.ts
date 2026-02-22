import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { BlogController } from "./blog.controller";

export function createBlogRoutes(controller: BlogController) {
  const router = new Hono();

  // Public routes (no auth)
  router.get("/", controller.list);
  router.get("/:slug", controller.getBySlug);

  // Protected routes (auth required)
  router.post("/", authMiddleware, controller.create);
  router.patch("/:id", authMiddleware, controller.update);
  router.delete("/:id", authMiddleware, controller.delete);

  return router;
}
