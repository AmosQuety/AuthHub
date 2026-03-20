import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";
import geoip from "geoip-lite";
import { subDays, startOfDay, endOfDay } from "date-fns"; // Helps with date bucket grouping

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = startOfDay(new Date());

    const activeSessions = await prisma.session.count({
      where: { expiresAt: { gt: new Date() } }
    });

    const loginsToday = await prisma.auditLog.count({
      where: {
        action: "LOGIN_SUCCESS",
        createdAt: { gte: today }
      }
    });

    const anomaliesLast7Days = await prisma.auditLog.count({
      where: {
        status: "BLOCKED",
        createdAt: { gte: subDays(new Date(), 7) }
      }
    });

    res.json({
      activeSessions,
      loginsToday,
      anomaliesLast7Days,
    });
  } catch (error) {
    next(error);
  }
};

export const getFunnel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Analytics for the last 7 days
    const since = subDays(new Date(), 7);

    // Get raw counts via Prisma
    const attempts = await prisma.auditLog.count({
      where: { action: { in: ["LOGIN_ATTEMPT", "LOGIN_FAILED", "LOGIN_SUCCESS", "MFA_CHALLENGED"] }, createdAt: { gte: since } }
    });

    const mfaChallenges = await prisma.auditLog.count({
      where: { action: "MFA_CHALLENED", createdAt: { gte: since } } // If you log this action explicitly
    });

    const successes = await prisma.auditLog.count({
      where: { action: "LOGIN_SUCCESS", createdAt: { gte: since } }
    });

    // We can structure the funnel data for rendering as a single BarChart with sequential drop-offs
    res.json([
      { stage: "Login Attempts", count: attempts },
      // Optional: Add MFA Challenges if tracked { stage: "MFA Challenges", count: mfaChallenges },
      { stage: "Successful Logins", count: successes },
    ]);
  } catch (error) {
    next(error);
  }
};

export const getHeatmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const since = subDays(new Date(), 30); // Heatmap over a longer period

    // Group logs by IP address to avoid pulling millions of individual rows
    // Since Prisma groupBy doesn't directly support resolving IPs in DB, we aggregate by IP.
    const groupByIp = await prisma.auditLog.groupBy({
      by: ["ipAddress"],
      where: {
        action: "LOGIN_SUCCESS",
        createdAt: { gte: since },
        ipAddress: { not: null, notIn: ["127.0.0.1", "::1"] } // Exclude local
      },
      _count: {
        _all: true,
      },
    });

    const countryMap: Record<string, { country: string; count: number }> = {};

    for (const record of groupByIp) {
      if (!record.ipAddress) continue;
      const geo = geoip.lookup(record.ipAddress);
      // In local dev, valid public IPs don't exist always, so default to "Unknown"
      const countryCode = geo?.country || "US"; // Defaulting to US for UI pop in dev, or "UNKNOWN" 
      
      if (!countryMap[countryCode]) {
        countryMap[countryCode] = { country: countryCode, count: 0 };
      }
      countryMap[countryCode].count += record._count._all;
    }

    const data = Object.values(countryMap).sort((a, b) => b.count - a.count).slice(0, 50);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getRiskTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const daysToLookBack = 14;
    const since = subDays(startOfDay(new Date()), daysToLookBack);

    // Fetch daily aggregates for SUCCESS vs BLOCKED.
    // In raw SQL we'd group by DATE_TRUNC, in Prisma we pull minimal info and bucket
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: since },
        action: { in: ["LOGIN_ATTEMPT", "LOGIN_SUCCESS", "LOGIN_FAILED", "MFA_FAILED"] },
      },
      select: {
        createdAt: true,
        status: true,
      }
    });

    // Bucket by day
    const trendMap: Record<string, { date: string, success: number, blocked: number, failed: number }> = {};

    // Initialize 14 days
    for (let i = 0; i <= daysToLookBack; i++) {
      const d = startOfDay(subDays(new Date(), i)).toISOString().split("T")[0];
      trendMap[d] = { date: d, success: 0, blocked: 0, failed: 0 };
    }

    for (const log of logs) {
      const day = startOfDay(log.createdAt).toISOString().split("T")[0];
      if (trendMap[day]) {
        if (log.status === "SUCCESS") trendMap[day].success += 1;
        else if (log.status === "BLOCKED") trendMap[day].blocked += 1;
        else if (log.status === "FAILURE") trendMap[day].failed += 1;
      }
    }

    // Sort chronologically (oldest to newest)
    const trends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json(trends);
  } catch (error) {
    next(error);
  }
};
