import type { Context } from "hono";
import type { NotificationService } from "./notification.service";

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  list = async (c: Context) => {
    const user = c.get("user") as { id: string };
    const notifications = await this.notificationService.list(user.id);
    return c.json(notifications);
  };

  countUnread = async (c: Context) => {
    const user = c.get("user") as { id: string };
    const count = await this.notificationService.countUnread(user.id);
    return c.json({ count });
  };

  markAsRead = async (c: Context) => {
    const user = c.get("user") as { id: string };
    const id = c.req.param("id");
    const result = await this.notificationService.markAsRead(id, user.id);
    return c.json(result);
  };

  markAllAsRead = async (c: Context) => {
    const user = c.get("user") as { id: string };
    await this.notificationService.markAllAsRead(user.id);
    return c.json({ success: true });
  };
}
