"use client";

import { useAnonymousChat } from "@/hooks/use-chat";
import { MatchmakingScreen } from "@/components/chat/matchmaking-screen";
import { ChatWindow } from "@/components/chat/chat-window";
import { Button } from "@/components/ui/button";
import { UserPlus, RotateCcw } from "lucide-react";
import { useAddFriend } from "@/hooks/use-add-friend";
import { useProfile } from "@/hooks/use-profile";

export default function AnonymousChatPage() {
  const {
    messages,
    status,
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
  } = useAnonymousChat();

  const { data: profile } = useProfile();
  const addFriend = useAddFriend();

  const handleAddFriend = () => {
    if (!partnerId) return;
    addFriend.mutate(partnerId);
  };

  if (status === "ended") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold">Chat Ended</h2>
          <p className="text-sm text-muted-foreground">
            The conversation has ended. Would you like to connect?
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleAddFriend} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Friend
          </Button>
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>
    );
  }

  if (status === "matched") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">{partnerName}</h3>
            <p className="text-xs text-muted-foreground">Anonymous Chat</p>
          </div>
          <Button variant="destructive" size="sm" onClick={endChat}>
            End Chat
          </Button>
        </div>
        <div className="flex-1">
          <ChatWindow
            messages={messages}
            onSendMessage={sendMessage}
            onTyping={handleTypingInput}
            partnerTyping={partnerTyping}
            partnerName={partnerName}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <MatchmakingScreen
        status={status}
        onStartSearch={startSearch}
        onCancel={cancelSearch}
        partnerName={partnerName}
        isPremium={profile?.isPremium}
        userCountry={profile?.country}
      />
    </div>
  );
}
