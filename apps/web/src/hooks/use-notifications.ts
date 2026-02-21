"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { wsClient } from "@/lib/ws-client";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

async function fetchNotifications() {
  const res = await fetch(`${API}/api/notifications`, {
    credentials: "include",
  });
  return res.json();
}

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch(`${API}/api/notifications/unread-count`, {
    credentials: "include",
  });
  const data = await res.json();
  return data.count;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], ...query } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
  });

  useEffect(() => {
    const unsub = wsClient.on("notification:new", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
    return unsub;
  }, [queryClient]);

  const markAsRead = async (id: string) => {
    await fetch(`${API}/api/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllAsRead = async () => {
    await fetch(`${API}/api/notifications/read-all`, {
      method: "PATCH",
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead, ...query };
}
