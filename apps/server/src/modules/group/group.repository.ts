import { eq, and } from "drizzle-orm";
import { group, groupMember } from "@chat-application/db/schema/chat";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class GroupRepository {
  constructor(private db: Database) {}

  async create(data: { name: string; type: "public" | "private"; hostId: string; maxMembers?: number }) {
    const id = Bun.randomUUIDv7();
    const inviteCode = data.type === "private" ? Math.random().toString(36).substring(2, 10).toUpperCase() : null;
    const [created] = await this.db.insert(group).values({ id, ...data, inviteCode }).returning();
    await this.db.insert(groupMember).values({ groupId: id, userId: data.hostId, role: "host" });
    return created;
  }

  async findById(id: string) {
    return this.db.query.group.findFirst({
      where: eq(group.id, id),
      with: { members: { with: { user: true } }, host: true },
    });
  }

  async findByInviteCode(code: string) {
    return this.db.query.group.findFirst({ where: eq(group.inviteCode, code) });
  }

  async listPublic() {
    return this.db.query.group.findMany({ where: eq(group.type, "public"), with: { host: true } });
  }

  async listUserGroups(userId: string) {
    return this.db.query.groupMember.findMany({
      where: eq(groupMember.userId, userId),
      with: { group: { with: { host: true } } },
    });
  }

  async addMember(groupId: string, userId: string, role: "admin" | "member" = "member") {
    return this.db.insert(groupMember).values({ groupId, userId, role }).returning();
  }

  async removeMember(groupId: string, userId: string) {
    return this.db.delete(groupMember).where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, userId))).returning();
  }

  async getMember(groupId: string, userId: string) {
    return this.db.query.groupMember.findFirst({
      where: and(eq(groupMember.groupId, groupId), eq(groupMember.userId, userId)),
    });
  }

  async getMemberCount(groupId: string) {
    const members = await this.db.query.groupMember.findMany({ where: eq(groupMember.groupId, groupId) });
    return members.length;
  }

  async delete(id: string) {
    return this.db.delete(group).where(eq(group.id, id)).returning();
  }

  async regenerateInviteCode(id: string) {
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    return this.db.update(group).set({ inviteCode: newCode }).where(eq(group.id, id)).returning();
  }
}
