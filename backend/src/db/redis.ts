import { Redis } from "ioredis";
import dotenv from "dotenv";
import logger from "../core/logger.js";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined in environment variables");
}

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableAutoPipelining: true,
  retryStrategy(times) {
    // Exponential backoff with jitter (max 2 seconds)
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("error", (err) => {
  logger.error({ err }, "redis_error");
});

redis.on("connect", () => {
  logger.info("connected_to_redis");
});

export default redis;
