"use client";

import { useParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/chat-window";
import { Users } from "lucide-react";
import { useGroupChat } from "@/hooks/use-group-chat";

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { group, messages, typingUsers, sendMessage, handleTyping } =
    useGroupChat(groupId);

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
