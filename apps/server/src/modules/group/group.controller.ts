import type { Context } from "hono";
import type { GroupService } from "./group.service";

export class GroupController {
  constructor(private groupService: GroupService) {}

  create = async (c: Context) => {
    const user = c.get("user") as { id: string };
    const body = await c.req.json<{ name: string; type: "public" | "private"; maxMembers?: number }>();
    const result = await this.groupService.create({ ...body, hostId: user.id });
    return c.json(result, 201);
  };

  getById = async (c: Context) => {
    const id = c.req.param("id");
    const result = await this.groupService.getById(id);
    if (!result) return c.json({ error: "Group not found" }, 404);
    return c.json(result);
  };

  listPublic = async (c: Context) => { return c.json(await this.groupService.listPublic()); };
  listMyGroups = async (c: Context) => { const user = c.get("user") as { id: string }; return c.json(await this.groupService.listUserGroups(user.id)); };

  joinPublic = async (c: Context) => {
    const user = c.get("user") as { id: string }; const id = c.req.param("id");
    try { return c.json(await this.groupService.joinPublic(id, user.id)); }
    catch (e: any) { return c.json({ error: e.message }, 400); }
  };

  joinByCode = async (c: Context) => {
    const user = c.get("user") as { id: string }; const { code } = await c.req.json<{ code: string }>();
    try { return c.json(await this.groupService.joinByCode(code, user.id)); }
    catch (e: any) { return c.json({ error: e.message }, 400); }
  };

  leave = async (c: Context) => {
    const user = c.get("user") as { id: string }; const id = c.req.param("id");
    try { await this.groupService.leave(id, user.id); return c.json({ success: true }); }
    catch (e: any) { return c.json({ error: e.message }, 400); }
  };

  kick = async (c: Context) => {
    const user = c.get("user") as { id: string }; const id = c.req.param("id"); const { userId } = await c.req.json<{ userId: string }>();
    try { await this.groupService.kick(id, userId, user.id); return c.json({ success: true }); }
    catch (e: any) { return c.json({ error: e.message }, 400); }
  };

  deleteGroup = async (c: Context) => {
    const user = c.get("user") as { id: string }; const id = c.req.param("id");
    try { await this.groupService.deleteGroup(id, user.id); return c.json({ success: true }); }
    catch (e: any) { return c.json({ error: e.message }, 400); }
  };

  regenerateCode = async (c: Context) => {
    const user = c.get("user") as { id: string }; const id = c.req.param("id");
    try { return c.json(await this.groupService.regenerateInviteCode(id, user.id)); }
    catch (e: any) { return c.json({ error: e.message }, 400); }
  };

  ban = async (c: Context) => {
    const user = c.get("user") as { id: string }; const id = c.req.param("id"); const { userId } = await c.req.json<{ userId: string }>();
    try { return c.json(await this.groupService.ban(id, userId, user.id)); }
    catch (e: any) { return c.json({ error: e.message }, 400); }
  };

  unban = async (c: Context) => {
    const user = c.get("user") as { id: string }; const id = c.req.param("id"); const { userId } = await c.req.json<{ userId: string }>();
    try { return c.json(await this.groupService.unban(id, userId, user.id)); }
    catch (e: any) { return c.json({ error: e.message }, 400); }
  };

  listBans = async (c: Context) => {
    const user = c.get("user") as { id: string }; const id = c.req.param("id");
    try { return c.json(await this.groupService.listBans(id, user.id)); }
    catch (e: any) { return c.json({ error: e.message }, 400); }
  };
}
