"use client";

import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ChatWindow } from "@/components/chat/chat-window";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFriendChat } from "@/hooks/use-friend-chat";

export default function FriendChatPage() {
  const params = useParams<{ friendshipId: string }>();
  const friendshipId = params.friendshipId;
  const { messages, partnerTyping, partnerName, partnerImage, sendMessage, handleTyping } =
    useFriendChat(friendshipId);

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
