import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";
import argon2 from "argon2";
import { randomBytes } from "crypto";
import { AuditService } from "../../core/audit.js";
import { sendMail } from "../../core/mailer.js";
import { generateTokens, hashPassword } from "../../core/crypto.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a URL-safe slug from a string: "My App" → "my-app" */
function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** Generates a client_id like: xemora_aB3kP9mNqR */
function generateClientId(name: string): string {
  const suffix = randomBytes(7).toString("base64url").slice(0, 10);
  return `${slugify(name)}_${suffix}`;
}

// Basic CRUD for managing OAuth Clients. 
// Fully protected by `authenticate` AND `requireRole("ADMIN")` middlewares inside the router.

export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, redirectUris, isConfidential, tenantId } = req.body;

        if (!name || !redirectUris || !Array.isArray(redirectUris)) {
            res.status(400).json({ error: "Name and redirectUris (array) are required" });
            return;
        }

        const clientSecret = isConfidential ? crypto.randomUUID() : null;

        const client = await prisma.oAuthClient.create({
            data: {
                clientId: crypto.randomUUID(), // Explicitly generated UUID for the client
                name,
                clientSecretHash: clientSecret ? await hashPassword(clientSecret) : "none", // Storing none for public clients to satisfy non-null
                redirectUris,
                isPublic: !isConfidential,
                tenantId: tenantId || null,
            }
        });

        // We only return the raw plain text secret ONCE on creation.
        res.status(201).json({
            message: "Client created",
            client: {
                ...client,
                clientSecret: clientSecret, // Only time this is visible
            }
        });
    } catch (error) {
        next(error);
    }
};

export const listClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const clients = await prisma.oAuthClient.findMany({
            select: {
                clientId: true,
                name: true,
                redirectUris: true,
                isPublic: true,
                tenantId: true,
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
        await prisma.oAuthClient.delete({
            where: { clientId: id }
        });
        res.json({ message: "Client deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string || "1", 10);
        const limit = parseInt(req.query.limit as string || "20", 10);
        const search = (req.query.search as string || "").trim();

        const where = search ? {
            OR: [{ email: { contains: search, mode: "insensitive" as const } }]
        } : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    emailVerified: true,
                    roles: true,
                    createdAt: true,
                    _count: { select: { sessions: true, mfaMethods: true } }
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where })
        ]);

        res.json({ users, total, page, limit });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = String(req.params.id);
        await prisma.session.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
        res.json({ message: "User deleted" });
    } catch (error) {
        next(error);
    }
};

export const impersonateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const targetUserId = String(req.params.id);
        const adminId = req.user?.sub;

        if (!adminId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        // Rule 1: Stamped and Audited
        AuditService.log({
            userId: targetUserId,
            action: "IMPERSONATION_STARTED",
            status: "SUCCESS",
            details: { impersonatorId: adminId }
        });

        // Rule 2: Token Injection with 'act' claim (No Refresh Token)
        const tokens = await generateTokens(targetUserId, `impersonation_${adminId}`, [], targetUser.roles, adminId);

        // Rule 3: User Transperancy Notifaction
        await sendMail({
            to: targetUser.email,
            subject: "Security Notice: Account Accessed by Support",
            html: `<p>A support agent (ID: ${adminId}) accessed your account at ${new Date().toUTCString()} to help resolve an ongoing ticket or issue.</p><p>This access is strictly time-limited to 15 minutes.</p>`
        });

        res.json({ accessToken: tokens.accessToken });
    } catch (error) {
        next(error);
    }
};
// =============================================================================
// Tenant Management
// =============================================================================

// POST /admin/tenants
export const createTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, logoUrl, primaryColor, customDomain, redirectUris } = req.body;

        if (!name || typeof name !== "string") {
            res.status(400).json({ error: "Tenant name is required" });
            return;
        }

        const clientId = generateClientId(name);
        const webhookSecret = randomBytes(20).toString("hex");

        const tenant = await prisma.tenant.create({
            data: {
                name,
                clientId,
                customDomain: customDomain || null,
                logoUrl: logoUrl || null,
                primaryColor: primaryColor || null,
                webhookSecret,
            },
        });

        res.status(201).json({
            message: "Tenant created",
            tenant,
            webhookSecret, // Shown only once on creation
        });
    } catch (error: any) {
        if (error?.code === "P2002") {
            res.status(409).json({ error: "A tenant with this name or custom domain already exists" });
            return;
        }
        next(error);
    }
};

// GET /admin/tenants
export const listTenants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                clientId: true,
                customDomain: true,
                logoUrl: true,
                primaryColor: true,
                requireMfa: true,
                allowPasskeys: true,
                createdAt: true,
                _count: { select: { users: true, clients: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ tenants });
    } catch (error) {
        next(error);
    }
};

// GET /admin/tenants/:id
export const getTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: req.params.id as string },
            select: {
                id: true,
                name: true,
                clientId: true,
                customDomain: true,
                logoUrl: true,
                primaryColor: true,
                requireMfa: true,
                allowPasskeys: true,
                emailFrom: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                webhookUrl: true,
                createdAt: true,
            },
        });
        if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
        res.json({ tenant });
    } catch (error) {
        next(error);
    }
};

// PATCH /admin/tenants/:id
export const updateTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const allowedFields = ["name", "logoUrl", "primaryColor", "customDomain", "requireMfa", "allowPasskeys", "webhookUrl", "emailFrom", "smtpHost", "smtpPort", "smtpUser"];
        const data: Record<string, any> = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) data[field] = req.body[field];
        }

        const tenant = await prisma.tenant.update({
            where: { id: req.params.id as string },
            data,
            select: { id: true, name: true, clientId: true, customDomain: true, logoUrl: true, primaryColor: true, requireMfa: true, allowPasskeys: true },
        });
        res.json({ tenant, message: "Tenant updated" });
    } catch (error: any) {
        if (error?.code === "P2025") { res.status(404).json({ error: "Tenant not found" }); return; }
        next(error);
    }
};

// DELETE /admin/tenants/:id
export const deleteTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await prisma.tenant.delete({ where: { id: req.params.id as string } });
        res.json({ message: "Tenant deleted" });
    } catch (error: any) {
        if (error?.code === "P2025") { res.status(404).json({ error: "Tenant not found" }); return; }
        next(error);
    }
};
