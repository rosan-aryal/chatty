import type { Context } from "hono";
import type { ChatService } from "./chat.service";

export class ChatController {
  constructor(private chatService: ChatService) {}

  getGroupMessages = async (c: Context) => {
    const groupId = c.req.param("groupId");
    const { limit, before } = c.req.query();
    const messages = await this.chatService.getGroupMessages(
      groupId,
      limit ? Number(limit) : undefined,
      before || undefined
    );
    return c.json(messages);
  };

  getFriendMessages = async (c: Context) => {
    const friendshipId = c.req.param("friendshipId");
    const { limit, before } = c.req.query();
    const messages = await this.chatService.getFriendMessages(
      friendshipId,
      limit ? Number(limit) : undefined,
      before || undefined
    );
    return c.json(messages);
  };
}
