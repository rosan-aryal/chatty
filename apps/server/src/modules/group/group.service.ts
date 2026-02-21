import type { GroupRepository } from "./group.repository";

export class GroupService {
  constructor(private groupRepo: GroupRepository) {}

  async create(data: { name: string; type: "public" | "private"; hostId: string; maxMembers?: number }) {
    return this.groupRepo.create(data);
  }

  async getById(id: string) { return this.groupRepo.findById(id); }
  async listPublic() { return this.groupRepo.listPublic(); }
  async listUserGroups(userId: string) { return this.groupRepo.listUserGroups(userId); }

  async joinPublic(groupId: string, userId: string) {
    const grp = await this.groupRepo.findById(groupId);
    if (!grp) throw new Error("Group not found");
    if (grp.type !== "public") throw new Error("Group is not public");
    const existing = await this.groupRepo.getMember(groupId, userId);
    if (existing) throw new Error("Already a member");
    const count = await this.groupRepo.getMemberCount(groupId);
    if (count >= grp.maxMembers) throw new Error("Group is full");
    return this.groupRepo.addMember(groupId, userId);
  }

  async joinByCode(code: string, userId: string) {
    const grp = await this.groupRepo.findByInviteCode(code);
    if (!grp) throw new Error("Invalid invite code");
    const existing = await this.groupRepo.getMember(grp.id, userId);
    if (existing) throw new Error("Already a member");
    const count = await this.groupRepo.getMemberCount(grp.id);
    if (count >= grp.maxMembers) throw new Error("Group is full");
    return this.groupRepo.addMember(grp.id, userId);
  }

  async leave(groupId: string, userId: string) {
    const member = await this.groupRepo.getMember(groupId, userId);
    if (!member) throw new Error("Not a member");
    if (member.role === "host") throw new Error("Host cannot leave, delete the group instead");
    return this.groupRepo.removeMember(groupId, userId);
  }

  async kick(groupId: string, targetUserId: string, requesterId: string) {
    const requester = await this.groupRepo.getMember(groupId, requesterId);
    if (!requester || (requester.role !== "host" && requester.role !== "admin")) throw new Error("Not authorized");
    const target = await this.groupRepo.getMember(groupId, targetUserId);
    if (!target) throw new Error("User is not a member");
    if (target.role === "host") throw new Error("Cannot kick the host");
    return this.groupRepo.removeMember(groupId, targetUserId);
  }

  async deleteGroup(groupId: string, userId: string) {
    const grp = await this.groupRepo.findById(groupId);
    if (!grp || grp.hostId !== userId) throw new Error("Not authorized");
    return this.groupRepo.delete(groupId);
  }

  async regenerateInviteCode(groupId: string, userId: string) {
    const grp = await this.groupRepo.findById(groupId);
    if (!grp || grp.hostId !== userId) throw new Error("Not authorized");
    if (grp.type !== "private") throw new Error("Only private groups have invite codes");
    return this.groupRepo.regenerateInviteCode(groupId);
  }
}
