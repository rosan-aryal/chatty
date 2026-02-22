import type { Context } from "hono";
import type { UserService } from "./user.service";

export class UserController {
  constructor(private userService: UserService) {}

  getProfile = async (c: Context) => {
    const user = c.get("user") as { id: string };
    const profile = await this.userService.getProfile(user.id);
    if (!profile) return c.json({ error: "User not found" }, 404);
    return c.json(profile);
  };

  onboard = async (c: Context) => {
    const user = c.get("user") as { id: string };
    const body = await c.req.json<{ gender: "male" | "female" | "other"; country: string }>();
    const result = await this.userService.onboard(user.id, body);
    return c.json(result);
  };

  updateVisibility = async (c: Context) => {
    const user = c.get("user") as { id: string };
    const { isAnonymous } = await c.req.json<{ isAnonymous: boolean }>();
    const result = await this.userService.updateVisibility(user.id, isAnonymous);
    return c.json(result);
  };
}
