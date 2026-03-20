import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";
import argon2 from "argon2";
import { subDays, startOfDay } from "date-fns";

// Basic CRUD for managing OAuth Clients owned by normal users. 
// Fully protected by `authenticate` middleware inside the router.

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

        const client = await prisma.oAuthClient.create({
            data: {
                clientId: crypto.randomUUID(), // Explicitly generated UUID for the client
                name,
                clientSecretHash: clientSecret ? await argon2.hash(clientSecret) : "none", // Storing none for public clients to satisfy non-null
                redirectUris,
                isPublic: !isConfidential,
                ownerId: userId,
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

        await prisma.oAuthClient.delete({
            where: { clientId: id }
        });
        res.json({ message: "Client deleted successfully" });
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
                clientSecretHash: await argon2.hash(newSecret),
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

        const clientIds = clients.map(c => c.clientId);
        const since = subDays(new Date(), 7);

        // Aggregate successful logins for these clients
        // We'll pull the last 100 logs and bucket them for simplicity since complex JSON pathing in Prisma depends on DB drivers.
        const logs = await prisma.auditLog.findMany({
            where: {
                action: "LOGIN_SUCCESS",
                createdAt: { gte: since },
                // This is a fuzzy search in the Json field for the client ID
                OR: clientIds.map(id => ({
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


