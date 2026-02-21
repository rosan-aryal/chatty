import { RedisClient } from "bun";
import { env } from "@chat-application/env/server";

export const redis = new RedisClient(env.REDIS_URL);

// Separate client for pub/sub subscriber (subscription takes over the connection)
export const createSubscriber = () => new RedisClient(env.REDIS_URL);
