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

    // Fetch daily aggregates using raw SQL for performance
    const trends: any[] = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "created_at")::text as date,
        COUNT(*) FILTER (WHERE status = 'SUCCESS')::int as success,
        COUNT(*) FILTER (WHERE status = 'FAILURE')::int as failed,
        COUNT(*) FILTER (WHERE status = 'BLOCKED')::int as blocked
      FROM audit_logs
      WHERE "created_at" >= ${since}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // Ensure we return the 'date' in YYYY-MM-DD format as the frontend expects
    const formattedTrends = trends.map(t => ({
      ...t,
      date: t.date.split(" ")[0] // Handle PostgreSQL timestamp string
    }));

    res.json(formattedTrends);
  } catch (error) {
    next(error);
  }
};
