import type { Context } from "hono";
import type { NotificationService } from "./notification.service";

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  list = async (c: Context) => {
    const user = c.get("user");
    const notifications = await this.notificationService.list(user.id);
    return c.json(notifications);
  };

  countUnread = async (c: Context) => {
    const user = c.get("user");
    const count = await this.notificationService.countUnread(user.id);
    return c.json({ count });
  };

  markAsRead = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    const result = await this.notificationService.markAsRead(id, user.id);
    return c.json(result);
  };

  markAllAsRead = async (c: Context) => {
    const user = c.get("user");
    await this.notificationService.markAllAsRead(user.id);
    return c.json({ success: true });
  };
}
