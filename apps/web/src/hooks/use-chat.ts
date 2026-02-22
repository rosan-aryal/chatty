"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { wsClient } from "@/lib/ws-client";

interface ChatMessage {
  content: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
}

export function useAnonymousChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<
    "idle" | "searching" | "matched" | "ended"
  >("idle");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myName, setMyName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubs = [
      wsClient.on("matchmaking:matched", (data) => {
        setStatus("matched");
        setRoomId(data.roomId);
        setMyName(data.anonymousName);
        setPartnerName(data.partnerName);
        setMessages([]);
      }),
      wsClient.on("matchmaking:timeout", () => {
        setStatus("idle");
      }),
      wsClient.on("chat:message", (data) => {
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
      wsClient.on("chat:ended", (data) => {
        setStatus("ended");
        setPartnerId(data.partnerId);
      }),
      wsClient.on("chat:typing", (data) => {
        setPartnerTyping(data.isTyping);
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const startSearch = useCallback((genderPreference?: string) => {
    setStatus("searching");
    wsClient.send("matchmaking:join", { genderPreference });
  }, []);

  const cancelSearch = useCallback(() => {
    setStatus("idle");
    wsClient.send("matchmaking:cancel");
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!roomId) return;
      wsClient.send("chat:message", { roomId, content });
      setMessages((prev) => [
        ...prev,
        {
          content,
          senderName: myName,
          timestamp: new Date().toISOString(),
          isOwn: true,
        },
      ]);
    },
    [roomId, myName]
  );

  const endChat = useCallback(() => {
    if (!roomId) return;
    wsClient.send("chat:end", { roomId });
  }, [roomId]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!roomId) return;
      wsClient.send("chat:typing", { roomId, isTyping });
    },
    [roomId]
  );

  const handleTypingInput = useCallback(() => {
    sendTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(false), 1500);
  }, [sendTyping]);

  const reset = useCallback(() => {
    setStatus("idle");
    setRoomId(null);
    setMessages([]);
    setMyName("");
    setPartnerName("");
    setPartnerId(null);
    setPartnerTyping(false);
  }, []);

  return {
    messages,
    status,
    roomId,
    myName,
    partnerName,
    partnerTyping,
    partnerId,
    startSearch,
    cancelSearch,
    sendMessage,
    endChat,
    handleTypingInput,
    reset,
  };
}
