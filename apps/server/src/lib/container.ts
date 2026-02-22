import { db } from "@chat-application/db";
import { redis } from "./redis";

import { UserRepository } from "../modules/user/user.repository";
import { FriendshipRepository } from "../modules/friendship/friendship.repository";
import { NotificationRepository } from "../modules/notification/notification.repository";
import { GroupRepository } from "../modules/group/group.repository";
import { ChatRepository } from "../modules/chat/chat.repository";
import { BlogRepository } from "../modules/blog/blog.repository";
import { ContactRepository } from "../modules/contact/contact.repository";

import { UserService } from "../modules/user/user.service";
import { FriendshipService } from "../modules/friendship/friendship.service";
import { NotificationService } from "../modules/notification/notification.service";
import { GroupService } from "../modules/group/group.service";
import { ChatService } from "../modules/chat/chat.service";
import { MatchmakingService } from "../modules/matchmaking/matchmaking.service";
import { BlogService } from "../modules/blog/blog.service";
import { ContactService } from "../modules/contact/contact.service";

import { UserController } from "../modules/user/user.controller";
import { FriendshipController } from "../modules/friendship/friendship.controller";
import { NotificationController } from "../modules/notification/notification.controller";
import { GroupController } from "../modules/group/group.controller";
import { ChatController } from "../modules/chat/chat.controller";
import { MatchmakingController } from "../modules/matchmaking/matchmaking.controller";
import { BlogController } from "../modules/blog/blog.controller";
import { ContactController } from "../modules/contact/contact.controller";

// Repositories
const userRepo = new UserRepository(db);
const friendshipRepo = new FriendshipRepository(db);
const notificationRepo = new NotificationRepository(db);
const groupRepo = new GroupRepository(db);
const chatRepo = new ChatRepository(db);
const blogRepo = new BlogRepository(db);
const contactRepo = new ContactRepository(db);

// Services
const userService = new UserService(userRepo);
const notificationService = new NotificationService(notificationRepo);
const friendshipService = new FriendshipService(friendshipRepo, notificationService);
const groupService = new GroupService(groupRepo);
const chatService = new ChatService(chatRepo);
const matchmakingService = new MatchmakingService(redis);
const blogService = new BlogService(blogRepo);
const contactService = new ContactService(contactRepo);

// Controllers
export const userController = new UserController(userService);
export const friendshipController = new FriendshipController(friendshipService);
export const notificationController = new NotificationController(notificationService);
export const groupController = new GroupController(groupService);
export const chatController = new ChatController(chatService);
export const matchmakingController = new MatchmakingController(matchmakingService);
export const blogController = new BlogController(blogService);
export const contactController = new ContactController(contactService);

// Export services for WebSocket handler access
export { chatService, groupService, friendshipService, matchmakingService, notificationService };
