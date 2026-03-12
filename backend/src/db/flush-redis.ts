import { Redis } from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redis = new Redis(process.env.REDIS_URL!);

async function flush() {
  await redis.flushall();
  console.log("Redis flushed!");
  process.exit(0);
}

flush();
