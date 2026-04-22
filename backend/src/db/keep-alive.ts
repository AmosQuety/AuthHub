import prisma from "./client.js";
import redis from "./redis.js";

export async function runKeepAlive() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Running Keep-Alive ping...`);

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`[${timestamp}] ✅ Database connection active.`);
  } catch (error) {
    console.error(`[${timestamp}] ❌ Database ping failed:`, error);
  }

  try {
    const key = "keep-alive:ping";
    await redis.set(key, timestamp, "EX", 60);
    const val = await redis.get(key);

    if (val === timestamp) {
      console.log(`[${timestamp}] ✅ Redis connection active.`);
    } else {
      throw new Error("Redis data mismatch");
    }
  } catch (error) {
    console.error(`[${timestamp}] ❌ Redis ping failed:`, error);
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.log(`[${timestamp}] ℹ️ Skipping Supabase ping (SUPABASE_URL/ANON_KEY not set).`);
      return;
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (response.ok) {
      console.log(`[${timestamp}] ✅ Supabase PostgREST ping active.`);
    } else {
      console.warn(`[${timestamp}] ⚠️ Supabase PostgREST ping returned ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[${timestamp}] ❌ Supabase ping failed:`, error);
  }
}

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('keep-alive.ts')) {
   runKeepAlive().then(() => process.exit(0)).catch(() => process.exit(1));
}
