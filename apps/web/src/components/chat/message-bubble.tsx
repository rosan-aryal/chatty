"use client";

interface MessageBubbleProps {
  content: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
}

export function MessageBubble({ content, senderName, timestamp, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] space-y-1`}>
        {!isOwn && (
          <span className="text-xs font-medium text-muted-foreground px-1">{senderName}</span>
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
        <span className={`text-[10px] text-muted-foreground/60 px-1 ${isOwn ? "text-right block" : ""}`}>
          {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
