import type { Notification } from "@/types/notifications";

export function getNotificationText(n: Notification): string {
  switch (n.type) {
    case "friend_request":
      return "You received a new friend request";
    case "friend_accepted":
      return "Your friend request was accepted";
    case "group_invite":
      return "You were invited to a group";
    default:
      return "New notification";
  }
}

export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString();
}
