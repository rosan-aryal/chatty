"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChatWindow } from "@/components/chat/chat-window";
import { wsClient } from "@/lib/ws-client";
import { env } from "@chat-application/env/web";
import { Users } from "lucide-react";

const API = env.NEXT_PUBLIC_SERVER_URL;

interface GroupMessage {
  content: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
}

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/groups/${groupId}`, {
        credentials: "include",
      });
      return res.json();
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["group-messages", groupId],
    queryFn: async () => {
      const res = await fetch(
        `${API}/api/chat/groups/${groupId}/messages?limit=50`,
        { credentials: "include" },
      );
      return res.json();
    },
  });

  // Seed messages from history
  useEffect(() => {
    if (history.length > 0) {
      const mapped = [...history].reverse().map((m: any) => ({
        content: m.content,
        senderName: m.sender?.name || "Unknown",
        timestamp: m.createdAt,
        isOwn: false,
      }));
      setMessages(mapped);
    }
  }, [history]);

  // Real-time events
  useEffect(() => {
    const unsubs = [
      wsClient.on("group:message", (data) => {
        if (data.groupId !== groupId) return;
        setMessages((prev) => [
          ...prev,
          {
            content: data.content,
            senderName: data.senderName,
            timestamp: data.timestamp,
            isOwn: false,
          },
        ]);
      }),
      wsClient.on("group:typing", (data) => {
        if (data.groupId !== groupId) return;
        setTypingUsers((prev) => {
          const next = new Set(prev);
          if (data.isTyping) next.add(data.userId);
          else next.delete(data.userId);
          return next;
        });
        // Auto-clear typing indicator after 3 seconds
        const existing = typingTimeouts.current.get(data.userId);
        if (existing) clearTimeout(existing);
        if (data.isTyping) {
          typingTimeouts.current.set(
            data.userId,
            setTimeout(() => {
              setTypingUsers((prev) => {
                const n = new Set(prev);
                n.delete(data.userId);
                return n;
              });
            }, 3000),
          );
        }
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
      typingTimeouts.current.forEach((t) => clearTimeout(t));
    };
  }, [groupId]);

  const sendMessage = useCallback(
    (content: string) => {
      wsClient.send("group:message", { groupId, content });
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
    [groupId],
  );

  const handleTyping = useCallback(() => {
    wsClient.send("group:typing", { groupId, isTyping: true });
    setTimeout(
      () => wsClient.send("group:typing", { groupId, isTyping: false }),
      1500,
    );
  }, [groupId]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">{group?.name || "Group"}</h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {group?.members?.length || 0} members
          </p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1">
        <ChatWindow
          messages={messages}
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          partnerTyping={typingUsers.size > 0}
          partnerName={
            typingUsers.size > 0
              ? `${typingUsers.size} typing`
              : undefined
          }
        />
      </div>
    </div>
  );
}
