import geoip from "geoip-lite";
import prisma from "../db/client.js";

interface RiskContext {
    userId: string;
    ipAddress: string;
    userAgent: string;
}

export class RiskEngine {
    /**
     * Calculates an anomaly score (0-100) for a login attempt.
     * Higher score = higher risk.
     */
    static async calculateRiskScore({ userId, ipAddress, userAgent }: RiskContext): Promise<number> {
        let score = 0;

        // Skip scoring for local development loopback IPs
        if (ipAddress === "127.0.0.1" || ipAddress === "::1") {
            return 0;
        }

        // 1. Fetch recent successful sessions for baseline
        const recentSessions = await prisma.session.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 5,
        });

        if (recentSessions.length === 0) {
            // First time login is inherently slightly higher risk, but shouldn't trigger block
            return 10;
        }

        // 2. IP Geolocation Anomaly Detection (+50 pts)
        const currentGeo = geoip.lookup(ipAddress);
        const currentCountry = currentGeo?.country || "UNKNOWN";

        const knownCountries = new Set<string>();
        recentSessions.forEach(session => {
            if (session.ipAddress && session.ipAddress !== "127.0.0.1" && session.ipAddress !== "::1") {
                const geo = geoip.lookup(session.ipAddress);
                if (geo?.country) knownCountries.add(geo.country);
            }
        });

        if (knownCountries.size > 0 && currentCountry !== "UNKNOWN" && !knownCountries.has(currentCountry)) {
            score += 50; // Logging in from a completely new country!
        }

        // 3. User-Agent / Device Anomaly Detection (+30 pts)
        const knownUserAgents = new Set<string>();
        recentSessions.forEach(session => {
            if (session.deviceInfo) knownUserAgents.add(session.deviceInfo);
        });

        if (knownUserAgents.size > 0 && !knownUserAgents.has(userAgent)) {
            score += 30; // Logging in from a completely new device/browser
        }

        // Ensure score stays within 0-100 bounds
        return Math.min(score, 100);
    }
}
