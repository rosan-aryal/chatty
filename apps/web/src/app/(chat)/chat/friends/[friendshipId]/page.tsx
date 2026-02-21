"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { ChatWindow } from "@/components/chat/chat-window";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { wsClient } from "@/lib/ws-client";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

interface FriendMessage {
  id: string;
  content: string;
  sender: { id: string; name: string; image?: string };
  createdAt: string;
}

interface FriendshipDetails {
  id: string;
  partner: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function FriendChatPage() {
  const { friendshipId } = useParams<{ friendshipId: string }>();
  const [messages, setMessages] = useState<
    Array<{
      content: string;
      senderName: string;
      timestamp: string;
      isOwn: boolean;
    }>
  >([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Fetch friendship details to get partner info
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

  // Load message history
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
          isOwn: false, // server marks own messages on the response
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <a
          href="/chat"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </a>
        <Avatar size="sm">
          {partnerImage && <AvatarImage src={partnerImage} alt={partnerName} />}
          <AvatarFallback>
            {partnerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{partnerName}</h3>
          {partnerTyping && (
            <p className="text-xs text-primary">typing...</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1">
        <ChatWindow
          messages={messages}
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          partnerTyping={partnerTyping}
          partnerName={partnerName}
        />
      </div>
    </div>
  );
}
