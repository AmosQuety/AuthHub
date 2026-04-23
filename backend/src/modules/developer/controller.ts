import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";
import { subDays, startOfDay } from "date-fns";
import { hashPassword, encryptSymmetric } from "../../core/crypto.js";
import { randomBytes } from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Creates a URL-safe slug: "My Awesome App" → "my-awesome-app" */
function slugify(str: string): string {
    return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** Generates a human-readable tenant clientId slug: "my-awesome-app_aB3kP9mR" */
function generateTenantSlug(name: string): string {
    const suffix = randomBytes(6).toString("base64url").slice(0, 8);
    return `${slugify(name)}_${suffix}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Developer Portal — OAuth Client + Tenant management
// Fully protected by `authenticate` middleware inside the router.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /developer/clients
 *
 * Atomically provisions:
 *   1. A Tenant   — the isolated data "space" for this app
 *   2. An OAuthClient — the OAuth 2.0 credentials linked to that tenant
 *
 * All users who register/login using this app's CLIENT_ID will automatically
 * have their tenant_id stamped to this tenant, keeping data fully isolated.
 */
export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, redirectUris, isConfidential } = req.body;
        const userId = req.user?.sub;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (!name || !redirectUris || !Array.isArray(redirectUris)) {
            res.status(400).json({ error: "Name and redirectUris (array) are required" });
            return;
        }

        const clientSecret = isConfidential ? crypto.randomUUID() : null;
        const tenantSlug   = generateTenantSlug(name);
        const webhookSecret = randomBytes(20).toString("hex");

        // ── Atomic transaction: Tenant + OAuthClient created together ────────
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Create the isolated tenant space
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    clientId: tenantSlug,   // Human-readable slug used in API calls
                    webhookSecret,
                },
            });

            // 2. Create the OAuth client, linked to the tenant
            const client = await tx.oAuthClient.create({
                data: {
                    clientId: crypto.randomUUID(),
                    name,
                    clientSecretHash: clientSecret ? await hashPassword(clientSecret) : "none",
                    redirectUris,
                    isPublic: !isConfidential,
                    ownerId: userId,
                    tenantId: tenant.id,    // ← Links this client to the tenant space
                },
            });

            return { tenant, client };
        });
        // ─────────────────────────────────────────────────────────────────────

        res.status(201).json({
            message: "Application registered. A new isolated tenant space has been provisioned.",
            client: {
                ...result.client,
                clientSecret,           // Only shown once — user must save this
            },
            tenant: {
                id:       result.tenant.id,
                name:     result.tenant.name,
                clientId: result.tenant.clientId,   // The slug used as AUTHHUB_CLIENT_ID in .env
            },
        });
    } catch (error: any) {
        if (error?.code === "P2002") {
            res.status(409).json({ error: "An app with this name already exists. Please choose a different name." });
            return;
        }
        next(error);
    }
};

export const listClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.sub;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const clients = await prisma.oAuthClient.findMany({
            where: { ownerId: userId },
            select: {
                clientId: true,
                name: true,
                redirectUris: true,
                isPublic: true,
                tenantId: true,   // ← needed for "Tenant Isolated" badge in UI
                tenant: true,     // ← needed for the Tenant Settings modal in UI
                createdAt: true,
            }
        });
        res.json({ clients });
    } catch (error) {
        next(error);
    }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.sub;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        // Must verify ownership before deletion!
        const client = await prisma.oAuthClient.findUnique({
             where: { clientId: id }
        });

        if (!client) {
             res.status(404).json({ error: "Client not found" });
             return;
        }

        if (client.ownerId !== userId) {
             res.status(403).json({ error: "Forbidden: You do not own this client" });
             return;
        }

        // Use a transaction to delete BOTH the OAuthClient and the linked Tenant
        await prisma.$transaction(async (tx: any) => {
             await tx.oAuthClient.delete({
                 where: { clientId: id }
             });
             
             if (client.tenantId) {
                 await tx.tenant.delete({
                     where: { id: client.tenantId }
                 });
             }
        });
        
        res.json({ message: "Client and its isolated tenant space deleted successfully" });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /developer/clients/:id/tenant
 * 
 * Allows users to update the branding and integration settings of their isolated tenant space.
 */
export const updateTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const clientId = req.params.id as string;
        const userId = req.user?.sub;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        // Must verify ownership
        const client = await prisma.oAuthClient.findUnique({
            where: { clientId }
        });

        if (!client) {
            res.status(404).json({ error: "Client not found" });
            return;
        }

        if (client.ownerId !== userId) {
            res.status(403).json({ error: "Forbidden: You do not own this client" });
            return;
        }

        if (!client.tenantId) {
            res.status(400).json({ error: "This client does not have an isolated tenant space" });
            return;
        }

        const {
            customDomain,
            logoUrl,
            primaryColor,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPass,
            emailFrom,
            webhookUrl
        } = req.body;

        const updateData: any = {};
        if (customDomain !== undefined) updateData.customDomain = customDomain || null;
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null;
        if (primaryColor !== undefined) updateData.primaryColor = primaryColor || null;
        if (emailFrom !== undefined) updateData.emailFrom = emailFrom || null;
        if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl || null;
        
        if (smtpHost !== undefined) updateData.smtpHost = smtpHost || null;
        if (smtpPort !== undefined) updateData.smtpPort = smtpPort ? Number(smtpPort) : null;
        if (smtpUser !== undefined) updateData.smtpUser = smtpUser || null;
        
        // Only update the hash if a brand new password was provided
        if (smtpPass) {
            updateData.smtpPassHash = encryptSymmetric(smtpPass);
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id: client.tenantId },
            data: updateData
        });

        res.json({ message: "Tenant configuration updated successfully", tenant: updatedTenant });
    } catch (error) {
        next(error);
    }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.sub;
        const { name, redirectUris, isConfidential } = req.body;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const client = await prisma.oAuthClient.findUnique({
            where: { clientId: id }
        });

        if (!client) {
            res.status(404).json({ error: "Client not found" });
            return;
        }

        if (client.ownerId !== userId) {
            res.status(403).json({ error: "Forbidden: You do not own this client" });
            return;
        }

        const updatedClient = await prisma.oAuthClient.update({
            where: { clientId: id },
            data: {
                name: name !== undefined ? name : client.name,
                redirectUris: redirectUris !== undefined ? redirectUris : client.redirectUris,
                isPublic: isConfidential !== undefined ? !isConfidential : client.isPublic,
            }
        });

        res.json({ message: "Client updated successfully", client: updatedClient });
    } catch (error) {
        next(error);
    }
};

export const rotateSecret = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.sub;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const client = await prisma.oAuthClient.findUnique({
            where: { clientId: id }
        });

        if (!client) {
            res.status(404).json({ error: "Client not found" });
            return;
        }

        if (client.ownerId !== userId) {
            res.status(403).json({ error: "Forbidden: You do not own this client" });
            return;
        }

        if (client.isPublic) {
            res.status(400).json({ error: "Public clients do not have secrets." });
            return;
        }

        const newSecret = crypto.randomUUID();
        const updatedClient = await prisma.oAuthClient.update({
            where: { clientId: id },
            data: {
                clientSecretHash: await hashPassword(newSecret),
            }
        });

        res.json({
            message: "Secret rotated successfully",
            clientSecret: newSecret, // Only time this is visible
        });
    } catch (error) {
        next(error);
    }
};

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const clients = await prisma.oAuthClient.findMany({
            where: { ownerId: userId },
            select: { clientId: true, name: true }
        });

        const clientIds = clients.map((c: any) => c.clientId);
        const since = subDays(new Date(), 7);

        // Aggregate successful logins for these clients
        // We'll pull the last 100 logs and bucket them for simplicity since complex JSON pathing in Prisma depends on DB drivers.
        const logs = await prisma.auditLog.findMany({
            where: {
                action: "LOGIN_SUCCESS",
                createdAt: { gte: since },
                // This is a fuzzy search in the Json field for the client ID
                OR: clientIds.map((id: any) => ({
                   details: { path: ["clientId"], equals: id } as any
                }))
            },
            select: { createdAt: true, details: true }
        });

        const statsMap: Record<string, number> = {};
        // Initialize days
        for (let i = 0; i < 7; i++) {
            const d = startOfDay(subDays(new Date(), i)).toISOString().split("T")[0];
            statsMap[d] = 0;
        }

        for (const log of logs) {
            const day = startOfDay(log.createdAt).toISOString().split("T")[0];
            if (statsMap[day] !== undefined) statsMap[day]++;
        }

        const chartData = Object.entries(statsMap)
            .map(([date, logins]) => ({ date, logins }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            totalLogins: logs.length,
            chartData
        });
    } catch (error) {
        next(error);
    }
};


