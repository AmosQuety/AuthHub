import prisma from "./client.js";
import redis from "./redis.js";

export async function runKeepAlive() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Running Keep-Alive ping...`);

  try {
    // 1. Database Ping
    await prisma.$queryRaw`SELECT 1`;
    console.log(`[${timestamp}] ✅ Database connection active.`);

    // 2. Redis Ping
    const key = "keep-alive:ping";
    await redis.set(key, timestamp, "EX", 60);
    const val = await redis.get(key);
    
    if (val === timestamp) {
      console.log(`[${timestamp}] ✅ Redis connection active.`);
    } else {
      throw new Error("Redis data mismatch");
    }

  } catch (error) {
    console.error(`[${timestamp}] ❌ Keep-Alive failed:`, error);
  }
}

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('keep-alive.ts')) {
   runKeepAlive().then(() => process.exit(0)).catch(() => process.exit(1));
}
