import type { Context } from "hono";
import type { FriendshipService } from "./friendship.service";

export class FriendshipController {
  constructor(private friendshipService: FriendshipService) {}

  sendRequest = async (c: Context) => {
    const user = c.get("user");
    const { addresseeId } = await c.req.json<{ addresseeId: string }>();
    try {
      const result = await this.friendshipService.sendRequest(user.id, addresseeId);
      return c.json(result, 201);
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  acceptRequest = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    try {
      const result = await this.friendshipService.acceptRequest(id, user.id);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  rejectRequest = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    try {
      const result = await this.friendshipService.rejectRequest(id, user.id);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  removeFriend = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    try {
      await this.friendshipService.removeFriend(id, user.id);
      return c.json({ success: true });
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  listFriends = async (c: Context) => {
    const user = c.get("user");
    const friends = await this.friendshipService.listFriends(user.id);
    return c.json(friends);
  };

  listPending = async (c: Context) => {
    const user = c.get("user");
    const pending = await this.friendshipService.listPendingRequests(user.id);
    return c.json(pending);
  };
}
