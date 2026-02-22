import type { MatchmakingService, QueueEntry } from "./matchmaking.service";

export class MatchmakingController {
  constructor(private matchmakingService: MatchmakingService) {}

  async handleJoinQueue(
    userId: string,
    gender: string | undefined,
    country: string | undefined,
    isPremium: boolean,
    genderPreference?: string,
    countryPreference?: string,
  ): Promise<{ queueKey: string }> {
    if (genderPreference && !isPremium) {
      throw new Error("Gender preference matching requires premium");
    }
    const entry: QueueEntry = { userId, gender, country, isPremium, timestamp: Date.now() };
    const queueKey = await this.matchmakingService.joinQueue(entry, genderPreference, countryPreference);
    return { queueKey };
  }

  async handleFindMatch(
    queueKey: string,
    currentUserId: string,
  ): Promise<{
    matched: boolean;
    roomId?: string;
    matchedUserId?: string;
    anonymousName1?: string;
    anonymousName2?: string;
  }> {
    const match = await this.matchmakingService.findMatch(queueKey, currentUserId);
    if (!match) return { matched: false };
    const roomId = this.matchmakingService.generateRoomId();
    const name1 = this.matchmakingService.generateAnonymousName();
    const name2 = this.matchmakingService.generateAnonymousName();
    await this.matchmakingService.setActiveRoom(roomId, currentUserId, match.userId);
    return { matched: true, roomId, matchedUserId: match.userId, anonymousName1: name1, anonymousName2: name2 };
  }

  async handleLeaveQueue(userId: string, queueKey: string): Promise<void> {
    await this.matchmakingService.leaveQueue(userId, queueKey);
  }

  async handleEndChat(roomId: string): Promise<{ user1Id: string; user2Id: string } | null> {
    const room = await this.matchmakingService.getActiveRoom(roomId);
    if (room) await this.matchmakingService.removeActiveRoom(roomId);
    return room;
  }
}
