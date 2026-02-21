import { auth } from "@chat-application/auth";
import { env } from "@chat-application/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { wsRoute, websocket } from "./ws";
import {
  userController,
  friendshipController,
  notificationController,
  groupController,
  chatController,
} from "./lib/container";
import { createUserRoutes } from "./modules/user/user.routes";
import { createFriendshipRoutes } from "./modules/friendship/friendship.routes";
import { createNotificationRoutes } from "./modules/notification/notification.routes";
import { createGroupRoutes } from "./modules/group/group.routes";
import { createChatRoutes } from "./modules/chat/chat.routes";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Auth routes
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// API routes
app.route("/api/user", createUserRoutes(userController));
app.route("/api/friends", createFriendshipRoutes(friendshipController));
app.route("/api/notifications", createNotificationRoutes(notificationController));
app.route("/api/groups", createGroupRoutes(groupController));
app.route("/api/chat", createChatRoutes(chatController));

// WebSocket
app.get("/ws", wsRoute);

// Health check
app.get("/", (c) => c.text("OK"));

export default {
  port: Number(env.BETTER_AUTH_URL.split(":").pop()) || 3000,
  fetch: app.fetch,
  websocket,
};
