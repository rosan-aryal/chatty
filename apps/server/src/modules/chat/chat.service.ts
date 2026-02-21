import type { ChatRepository } from "./chat.repository";

export class ChatService {
  constructor(private chatRepo: ChatRepository) {}

  async saveGroupMessage(data: {
    content: string;
    senderId: string;
    groupId: string;
  }) {
    return this.chatRepo.createMessage(data);
  }

  async saveFriendMessage(data: {
    content: string;
    senderId: string;
    friendshipId: string;
  }) {
    return this.chatRepo.createMessage(data);
  }

  async getGroupMessages(groupId: string, limit?: number, before?: string) {
    return this.chatRepo.getGroupMessages(groupId, limit, before);
  }

  async getFriendMessages(
    friendshipId: string,
    limit?: number,
    before?: string
  ) {
    return this.chatRepo.getFriendMessages(friendshipId, limit, before);
  }
}
