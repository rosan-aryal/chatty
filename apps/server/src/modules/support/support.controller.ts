import type { Context } from "hono";
import type { SupportService } from "./support.service";

export class SupportController {
  constructor(private supportService: SupportService) {}

  submitTicket = async (c: Context) => {
    const body = await c.req.json<{
      name: string;
      email: string;
      subject: string;
      message: string;
    }>();
    const ticket = await this.supportService.submitTicket(body);
    return c.json(ticket, 201);
  };

  submitFeedback = async (c: Context) => {
    const body = await c.req.json<{
      name: string;
      email: string;
      rating: number;
      message: string;
    }>();
    const entry = await this.supportService.submitFeedback(body);
    return c.json(entry, 201);
  };
}
