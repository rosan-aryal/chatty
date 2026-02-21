import { db } from "@chat-application/db";
import { redis } from "./redis";

import { UserRepository } from "../modules/user/user.repository";
import { FriendshipRepository } from "../modules/friendship/friendship.repository";
import { NotificationRepository } from "../modules/notification/notification.repository";
import { GroupRepository } from "../modules/group/group.repository";
import { ChatRepository } from "../modules/chat/chat.repository";

import { UserService } from "../modules/user/user.service";
import { FriendshipService } from "../modules/friendship/friendship.service";
import { NotificationService } from "../modules/notification/notification.service";
import { GroupService } from "../modules/group/group.service";
import { ChatService } from "../modules/chat/chat.service";
import { MatchmakingService } from "../modules/matchmaking/matchmaking.service";

import { UserController } from "../modules/user/user.controller";
import { FriendshipController } from "../modules/friendship/friendship.controller";
import { NotificationController } from "../modules/notification/notification.controller";
import { GroupController } from "../modules/group/group.controller";
import { ChatController } from "../modules/chat/chat.controller";
import { MatchmakingController } from "../modules/matchmaking/matchmaking.controller";

// Repositories
const userRepo = new UserRepository(db);
const friendshipRepo = new FriendshipRepository(db);
const notificationRepo = new NotificationRepository(db);
const groupRepo = new GroupRepository(db);
const chatRepo = new ChatRepository(db);

// Services
const userService = new UserService(userRepo);
const notificationService = new NotificationService(notificationRepo);
const friendshipService = new FriendshipService(friendshipRepo, notificationService);
const groupService = new GroupService(groupRepo);
const chatService = new ChatService(chatRepo);
const matchmakingService = new MatchmakingService(redis);

// Controllers
export const userController = new UserController(userService);
export const friendshipController = new FriendshipController(friendshipService);
export const notificationController = new NotificationController(notificationService);
export const groupController = new GroupController(groupService);
export const chatController = new ChatController(chatService);
export const matchmakingController = new MatchmakingController(matchmakingService);

// Export services for WebSocket handler access
export { chatService, groupService, friendshipService, matchmakingService, notificationService };
