"use client";

import { User } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
  senderImage?: string;
  isAnonymous?: boolean;
}

export function MessageBubble({
  content,
  senderName,
  timestamp,
  isOwn,
  senderImage,
  isAnonymous = false,
}: MessageBubbleProps) {
  const avatar = (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
      {isAnonymous || !senderImage ? (
        <User className="h-4 w-4 text-muted-foreground" />
      ) : (
        <img src={senderImage} alt={senderName} className="h-8 w-8 rounded-full object-cover" />
      )}
    </div>
  );

  return (
    <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      {!isOwn && avatar}
      <div className="max-w-[70%] space-y-1">
        {!isOwn && (
          <span className="text-xs font-medium text-muted-foreground px-1">
            {senderName}
          </span>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          }`}
        >
          {content}
        </div>
        <span
          className={`text-[10px] text-muted-foreground/60 px-1 ${
            isOwn ? "text-right block" : ""
          }`}
        >
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      {isOwn && avatar}
    </div>
  );
}
