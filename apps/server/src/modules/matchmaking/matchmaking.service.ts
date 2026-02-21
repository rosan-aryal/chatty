import type { RedisClient } from "bun";

const ANONYMOUS_ADJECTIVES = [
  "Brave", "Calm", "Clever", "Bold", "Swift", "Wise", "Kind", "Bright",
  "Gentle", "Fierce", "Noble", "Witty", "Keen", "Daring", "Lucky",
];

const ANONYMOUS_ANIMALS = [
  "Fox", "Owl", "Bear", "Wolf", "Hawk", "Deer", "Lynx", "Otter",
  "Raven", "Tiger", "Eagle", "Panda", "Koala", "Falcon", "Dolphin",
];

function generateAnonymousName(): string {
  const adj = ANONYMOUS_ADJECTIVES[Math.floor(Math.random() * ANONYMOUS_ADJECTIVES.length)];
  const animal = ANONYMOUS_ANIMALS[Math.floor(Math.random() * ANONYMOUS_ANIMALS.length)];
  return `${adj} ${animal}`;
}

export interface QueueEntry {
  userId: string;
  gender?: string;
  isPremium: boolean;
  timestamp: number;
}

export class MatchmakingService {
  private readonly QUEUE_PREFIX = "matchmaking:queue:";
  private readonly TIMEOUT_MS = 60_000;

  constructor(private redis: RedisClient) {}

  async joinQueue(entry: QueueEntry, genderPreference?: string): Promise<string> {
    const queueKey = genderPreference
      ? `${this.QUEUE_PREFIX}${genderPreference}`
      : `${this.QUEUE_PREFIX}random`;
    await this.redis.send("LPUSH", [queueKey, JSON.stringify(entry)]);
    return queueKey;
  }

  async leaveQueue(userId: string, queueKey: string): Promise<void> {
    const entries = await this.redis.send("LRANGE", [queueKey, "0", "-1"]);
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        const parsed = JSON.parse(entry as string) as QueueEntry;
        if (parsed.userId === userId) {
          await this.redis.send("LREM", [queueKey, "1", entry as string]);
          break;
        }
      }
    }
  }

  async findMatch(queueKey: string, currentUserId: string): Promise<QueueEntry | null> {
    const raw = await this.redis.send("RPOP", [queueKey]);
    if (!raw) return null;
    const entry = JSON.parse(raw as string) as QueueEntry;
    if (entry.userId === currentUserId) {
      await this.redis.send("RPUSH", [queueKey, raw as string]);
      return null;
    }
    if (Date.now() - entry.timestamp > this.TIMEOUT_MS) return null;
    return entry;
  }

  generateRoomId(): string {
    return `room:${Bun.randomUUIDv7()}`;
  }

  generateAnonymousName(): string {
    return generateAnonymousName();
  }

  async setActiveRoom(roomId: string, user1Id: string, user2Id: string): Promise<void> {
    await this.redis.set(roomId, JSON.stringify({ user1Id, user2Id }));
    await this.redis.send("EXPIRE", [roomId, "7200"]);
  }

  async getActiveRoom(roomId: string): Promise<{ user1Id: string; user2Id: string } | null> {
    const raw = await this.redis.get(roomId);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  async removeActiveRoom(roomId: string): Promise<void> {
    await this.redis.send("DEL", [roomId]);
  }
}
