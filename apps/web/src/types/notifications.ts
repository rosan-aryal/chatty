export interface Notification {
  id: string;
  type: "friend_request" | "friend_accepted" | "group_invite";
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}
