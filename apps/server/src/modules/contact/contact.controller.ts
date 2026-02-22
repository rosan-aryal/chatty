import type { Context } from "hono";
import type { ContactService } from "./contact.service";

export class ContactController {
  constructor(private contactService: ContactService) {}

  list = async (c: Context) => {
    const messages = await this.contactService.list();
    return c.json(messages);
  };

  submit = async (c: Context) => {
    const body = await c.req.json<{
      name: string;
      email: string;
      subject: string;
      message: string;
    }>();
    const msg = await this.contactService.submit(body);
    return c.json(msg, 201);
  };

  markAsRead = async (c: Context) => {
    const id = c.req.param("id");
    const msg = await this.contactService.markAsRead(id);
    if (!msg) return c.json({ error: "Message not found" }, 404);
    return c.json(msg);
  };

  delete = async (c: Context) => {
    const id = c.req.param("id");
    const msg = await this.contactService.delete(id);
    if (!msg) return c.json({ error: "Message not found" }, 404);
    return c.json({ success: true });
  };
}
