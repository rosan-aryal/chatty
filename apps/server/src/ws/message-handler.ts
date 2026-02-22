import { connectionManager, type WsUserData } from "./connection-manager";
import {
  matchmakingController,
  chatService,
  groupService,
  friendshipService,
} from "../lib/container";
import { redis } from "../lib/redis";
import type { ServerWebSocket } from "bun";


const userQueueKeys = new Map<string, string>();
const userRooms = new Map<string, string>();
const userAnonymousNames = new Map<string, Map<string, string>>();
const userTimers = new Map<string, ReturnType<typeof setInterval>>();

interface WsMessage {
  type: string;
  data?: any;
}

export async function handleWsMessage(ws: ServerWebSocket<WsUserData>, raw: string, userData: WsUserData) {
  const { userId, gender, country, isPremium } = userData;

  let msg: WsMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    ws.send(JSON.stringify({ type: "error", data: { message: "Invalid JSON" } }));
    return;
  }

  switch (msg.type) {
    case "matchmaking:join": {
      try {
        const { queueKey } = await matchmakingController.handleJoinQueue(
          userId, gender, country, isPremium, msg.data?.genderPreference, msg.data?.countryPreference
        );
        userQueueKeys.set(userId, queueKey);

        const tryMatch = async () => {
          const result = await matchmakingController.handleFindMatch(queueKey, userId);
          if (result.matched && result.roomId && result.matchedUserId) {
            userRooms.set(userId, result.roomId);
            userRooms.set(result.matchedUserId, result.roomId);

            const nameMap = new Map<string, string>();
            nameMap.set(userId, result.anonymousName1!);
            nameMap.set(result.matchedUserId, result.anonymousName2!);
            userAnonymousNames.set(result.roomId, nameMap);

            connectionManager.sendTo(userId, {
              type: "matchmaking:matched",
              data: { roomId: result.roomId, anonymousName: result.anonymousName1, partnerName: result.anonymousName2 },
            });
            connectionManager.sendTo(result.matchedUserId, {
              type: "matchmaking:matched",
              data: { roomId: result.roomId, anonymousName: result.anonymousName2, partnerName: result.anonymousName1 },
            });

            userQueueKeys.delete(userId);
            userQueueKeys.delete(result.matchedUserId);
            const timer = userTimers.get(userId);
            if (timer) { clearInterval(timer); userTimers.delete(userId); }
            return true;
          }
          return false;
        };

        const matched = await tryMatch();
        if (!matched) {
          // Poll every 3 seconds
          const intervalId = setInterval(async () => {
            const found = await tryMatch();
            if (found) {
              clearInterval(intervalId);
              userTimers.delete(userId);
            }
          }, 3000);
          userTimers.set(userId, intervalId);

          // 60s timeout
          setTimeout(() => {
            const timer = userTimers.get(userId);
            if (timer) {
              clearInterval(timer);
              userTimers.delete(userId);
            }
            if (userQueueKeys.has(userId)) {
              connectionManager.sendTo(userId, { type: "matchmaking:timeout" });
              matchmakingController.handleLeaveQueue(userId, queueKey);
              userQueueKeys.delete(userId);
            }
          }, 60000);
        }
      } catch (e: any) {
        ws.send(JSON.stringify({ type: "error", data: { message: e.message } }));
      }
      break;
    }

    case "matchmaking:cancel": {
      const queueKey = userQueueKeys.get(userId);
      if (queueKey) {
        await matchmakingController.handleLeaveQueue(userId, queueKey);
        userQueueKeys.delete(userId);
      }
      const timer = userTimers.get(userId);
      if (timer) { clearInterval(timer); userTimers.delete(userId); }
      break;
    }

    case "chat:message": {
      const { roomId, content } = msg.data;
      const names = userAnonymousNames.get(roomId);
      const senderName = names?.get(userId) || "Anonymous";
      const rawRoom = await redis.get(roomId);
      if (rawRoom) {
        const roomData = JSON.parse(rawRoom);
        const partnerId = roomData.user1Id === userId ? roomData.user2Id : roomData.user1Id;
        connectionManager.sendTo(partnerId, {
          type: "chat:message",
          data: { roomId, content, senderName, timestamp: new Date().toISOString() },
        });
      }
      break;
    }

    case "chat:end": {
      const { roomId } = msg.data;
      const room = await matchmakingController.handleEndChat(roomId);
      if (room) {
        connectionManager.sendTo(room.user1Id, {
          type: "chat:ended",
          data: { roomId, canAddFriend: true, partnerId: room.user2Id },
        });
        connectionManager.sendTo(room.user2Id, {
          type: "chat:ended",
          data: { roomId, canAddFriend: true, partnerId: room.user1Id },
        });
        userRooms.delete(room.user1Id);
        userRooms.delete(room.user2Id);
        userAnonymousNames.delete(roomId);
      }
      break;
    }

    case "chat:typing": {
      const { roomId, isTyping } = msg.data;
      const rawRoom = await redis.get(roomId);
      if (rawRoom) {
        const roomData = JSON.parse(rawRoom);
        const partnerId = roomData.user1Id === userId ? roomData.user2Id : roomData.user1Id;
        connectionManager.sendTo(partnerId, { type: "chat:typing", data: { roomId, isTyping } });
      }
      break;
    }

    case "group:message": {
      const { groupId, content } = msg.data;
      const [saved] = await chatService.saveGroupMessage({ content, senderId: userId, groupId });
      const grp = await groupService.getById(groupId);
      if (grp && saved) {
        const memberIds = grp.members.map((m: any) => m.userId).filter((id: string) => id !== userId);
        const senderMember = grp.members.find((m: any) => m.userId === userId);
        connectionManager.broadcast(memberIds, {
          type: "group:message",
          data: { groupId, content, senderId: userId, senderName: senderMember?.user?.name || "Unknown", messageId: saved.id, timestamp: saved.createdAt },
        });
      }
      break;
    }

    case "group:typing": {
      const { groupId, isTyping } = msg.data;
      const grp = await groupService.getById(groupId);
      if (grp) {
        const memberIds = grp.members.map((m: any) => m.userId).filter((id: string) => id !== userId);
        connectionManager.broadcast(memberIds, { type: "group:typing", data: { groupId, userId, isTyping } });
      }
      break;
    }

    case "friend:message": {
      const { friendshipId, content } = msg.data;
      const [saved] = await chatService.saveFriendMessage({ content, senderId: userId, friendshipId });
      const fs = await friendshipService.listFriends(userId);
      const found = fs.find((f: any) => f.id === friendshipId);
      if (found && saved) {
        const friendId = found.requesterId === userId ? found.addresseeId : found.requesterId;
        connectionManager.sendTo(friendId, {
          type: "friend:message",
          data: { friendshipId, content, senderId: userId, messageId: saved.id, timestamp: saved.createdAt },
        });
      }
      break;
    }

    case "friend:typing": {
      const { friendshipId, isTyping } = msg.data;
      const fs = await friendshipService.listFriends(userId);
      const found = fs.find((f: any) => f.id === friendshipId);
      if (found) {
        const friendId = found.requesterId === userId ? found.addresseeId : found.requesterId;
        connectionManager.sendTo(friendId, { type: "friend:typing", data: { friendshipId, isTyping } });
      }
      break;
    }

    default:
      ws.send(JSON.stringify({ type: "error", data: { message: `Unknown message type: ${msg.type}` } }));
  }
}

export function handleWsClose(userId: string) {
  connectionManager.remove(userId);
  const queueKey = userQueueKeys.get(userId);
  if (queueKey) {
    matchmakingController.handleLeaveQueue(userId, queueKey);
    userQueueKeys.delete(userId);
  }
  const timer = userTimers.get(userId);
  if (timer) { clearInterval(timer); userTimers.delete(userId); }
  const roomId = userRooms.get(userId);
  if (roomId) {
    matchmakingController.handleEndChat(roomId).then((room) => {
      if (room) {
        const partnerId = room.user1Id === userId ? room.user2Id : room.user1Id;
        connectionManager.sendTo(partnerId, {
          type: "chat:ended",
          data: { roomId, canAddFriend: true, partnerId: userId },
        });
        userRooms.delete(room.user1Id);
        userRooms.delete(room.user2Id);
        userAnonymousNames.delete(roomId);
      }
    });
  }
}
