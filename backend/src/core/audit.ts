import prisma from "../db/client.js";
import { Prisma } from "@prisma/client";

interface AuditLogPayload {
    userId?: string;
    action: string;
    ipAddress?: string;
    deviceInfo?: string;
    status: "SUCCESS" | "FAILURE" | "BLOCKED";
    details?: any;
}

export class AuditService {
    /**
     * Asynchronously records an authentication or security event.
     * We don't await this in the main request flow to avoid adding latency.
     */
    static log(payload: AuditLogPayload): void {
        // Fire and forget, catching errors internally so it doesn't crash the server
        prisma.auditLog.create({
            data: {
                ...payload,
                details: payload.details ? JSON.stringify(payload.details) : Prisma.DbNull,
            }
        }).catch((err: unknown) => {
            console.error("Failed to write to AuditLog:", err);
        });
    }
}
