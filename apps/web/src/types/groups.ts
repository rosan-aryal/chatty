export interface Group {
  id: string;
  name: string;
  type: "public" | "private";
  inviteCode?: string;
  hostId: string;
  maxMembers: number;
  host?: { name: string };
  members?: Array<{ userId: string; role: string }>;
}

export interface GroupMembership {
  groupId: string;
  role: "host" | "admin" | "member";
  group?: Group;
}
