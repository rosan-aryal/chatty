export interface ChatMessage {
  content: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
  senderId?: string;
  senderImage?: string;
  isAnonymous?: boolean;
}
