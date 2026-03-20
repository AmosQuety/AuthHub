import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../db/redis.js";

// General strict limiter for auth endpoints (login, register)
// 5 requests per 15 minutes per IP
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
        prefix: "rl:auth:",
    }),
    message: {
        error: "Too many login/registration attempts, please try again after 15 minutes.",
    },
});

// Targeted login limiter — skips counting on success so only failed attempts
// count towards lockout. 10 attempts per 15 min per IP.
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
        prefix: "rl:login:",
    }),
    handler: (_req, res) => res.status(429).json({
        error: "too_many_attempts",
        message: "Too many login attempts. Try again in 15 minutes.",
    }),
});

// Soft limiter for register endpoint
// 5 registrations per hour per IP
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
        prefix: "rl:register:",
    }),
    message: {
        error: "Too many registration attempts. Please try again in an hour.",
    },
});

// Softer limiter for refresh token endpoint
// 20 requests per hour per IP
export const refreshLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
        prefix: "rl:refresh:",
    }),
    message: {
        error: "Too many token refresh attempts, please try again later.",
    },
});

// OAuth /token endpoint limiter — 20 req/min per IP
export const tokenLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
        prefix: "rl:token:",
    }),
    message: {
        error: "Too many token requests. Please slow down.",
    },
});

// ---------------------------------------------------------------------------
// Brute-Force Protection Service
// Tracks failed login attempts per email in Redis — separate from IP rate
// limiting so credential-stuffing attacks against a single account are caught
// even if they distribute across different IP addresses.
// ---------------------------------------------------------------------------

const FAIL_KEY = (email: string) => `brute:${email.toLowerCase()}`;
const LOCK_KEY = (email: string) => `lock:${email.toLowerCase()}`;

// Thresholds
const SOFT_THRESHOLD = 5;   // lock for 15 min
const HARD_THRESHOLD = 10;  // lock for 60 min
const SOFT_TTL = 15 * 60;   // seconds
const HARD_TTL = 60 * 60;   // seconds

export const BruteForceService = {
    /**
     * Returns lockout info if the email is currently locked out,
     * or null if the account is free to attempt login.
     */
    async getLockout(email: string): Promise<{ ttl: number; message: string } | null> {
        const ttl = await redisClient.ttl(LOCK_KEY(email));
        if (ttl > 0) {
            const minutes = Math.ceil(ttl / 60);
            return {
                ttl,
                message: `Account temporarily locked due to too many failed attempts. Try again in ${minutes} minute(s).`,
            };
        }
        return null;
    },

    /**
     * Increments the failure counter for an email.
     * Applies a soft or hard lockout once thresholds are breached.
     */
    async recordFailure(email: string): Promise<void> {
        const key = FAIL_KEY(email);
        const failures = await redisClient.incr(key);

        // Keep the counter alive for 1 hour
        if (failures === 1) {
            await redisClient.expire(key, HARD_TTL);
        }

        if (failures >= HARD_THRESHOLD) {
            await redisClient.setex(LOCK_KEY(email), HARD_TTL, "1");
        } else if (failures >= SOFT_THRESHOLD) {
            await redisClient.setex(LOCK_KEY(email), SOFT_TTL, "1");
        }
    },

    /**
     * Resets the failure counter after a successful login.
     */
    async reset(email: string): Promise<void> {
        await redisClient.del(FAIL_KEY(email));
        await redisClient.del(LOCK_KEY(email));
    },
};
