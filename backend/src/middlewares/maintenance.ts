import { Request, Response, NextFunction } from "express";
import prisma from "../db/client.js";
import redis from "../db/redis.js";

/**
 * Maintenance Middleware
 * 
 * Prevents non-admin access when the platform is undergoing maintenance.
 * Uses Redis to cache the settings for high performance on every request.
 */
export const checkMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Try to get maintenance status from Redis
    let maintenanceMode = await redis.get("hub:system:maintenance");

    if (maintenanceMode === null) {
      // 2. Cache miss: Fetch from DB
      const settings = await prisma.systemSettings.findFirst({
        where: { id: 1 }
      });
      
      maintenanceMode = settings?.maintenanceMode ? "true" : "false";
      
      // Cache for 5 minutes
      await redis.setex("hub:system:maintenance", 300, maintenanceMode);
    }

    // 3. If ON, check if user is an admin
    if (maintenanceMode === "true") {
      // Admins are exempt so they can use the console to turn maintenance OFF
      const user = (req as any).user;
      const isAdmin = user?.roles?.includes("ADMIN");

      // We also exempt the health check and the login routes
      const isPublicPath = req.path.includes("/health") || req.path.includes("/auth/login") || req.path.includes("/auth/me");

      if (!isAdmin && !isPublicPath) {
        res.status(503).json({
          error: "Service Unavailable",
          message: "The platform is currently undergoing scheduled maintenance. Please try again later.",
          retryAfter: 3600
        });
        return;
      }
    }

    next();
  } catch (error) {
    // If DB/Redis fails, we fail open (allow traffic) but log it
    console.error("Maintenance check failed:", error);
    next();
  }
};
