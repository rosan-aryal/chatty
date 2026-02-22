import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import type { FriendshipDetails, FriendMessage } from "@/types/friends";
import type { ChatMessage } from "@/types/chat";
import { wsClient } from "@/lib/ws-client";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

export function useFriendChat(friendshipId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: friendship } = useQuery<FriendshipDetails>({
    queryKey: ["friendship", friendshipId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/friends/${friendshipId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load friendship");
      return res.json();
    },
  });

  const partnerName = friendship?.partner?.name ?? "Friend";
  const partnerImage = friendship?.partner?.image;

  const { data: history = [] } = useQuery<FriendMessage[]>({
    queryKey: ["friend-messages", friendshipId],
    queryFn: async () => {
      const res = await fetch(
        `${API}/api/chat/friends/${friendshipId}/messages?limit=50`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
  });

  // Seed messages from history (oldest first)
  useEffect(() => {
    if (history.length > 0) {
      setMessages(
        [...history].reverse().map((m) => ({
          content: m.content,
          senderName: m.sender?.name ?? "Friend",
          timestamp: m.createdAt,
          isOwn: false,
        })),
      );
    }
  }, [history]);

  // Subscribe to real-time events
  useEffect(() => {
    const unsubs = [
      wsClient.on("friend:message", (data) => {
        if (data.friendshipId !== friendshipId) return;
        setMessages((prev) => [
          ...prev,
          {
            content: data.content,
            senderName: data.senderName ?? partnerName,
            timestamp: data.timestamp,
            isOwn: false,
          },
        ]);
      }),
      wsClient.on("friend:typing", (data) => {
        if (data.friendshipId !== friendshipId) return;
        setPartnerTyping(data.isTyping);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        if (data.isTyping) {
          typingTimeout.current = setTimeout(
            () => setPartnerTyping(false),
            3000,
          );
        }
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [friendshipId, partnerName]);

  const sendMessage = useCallback(
    (content: string) => {
      wsClient.send("friend:message", { friendshipId, content });
      setMessages((prev) => [
        ...prev,
        {
          content,
          senderName: "You",
          timestamp: new Date().toISOString(),
          isOwn: true,
        },
      ]);
    },
    [friendshipId],
  );

  const handleTyping = useCallback(() => {
    wsClient.send("friend:typing", { friendshipId, isTyping: true });
    setTimeout(
      () => wsClient.send("friend:typing", { friendshipId, isTyping: false }),
      1500,
    );
  }, [friendshipId]);

  return { friendship, messages, partnerTyping, partnerName, partnerImage, sendMessage, handleTyping };
}
