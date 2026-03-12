import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";

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
                clientSecretHash: clientSecret ? await require("argon2").hash(clientSecret) : "none", // Storing none for public clients to satisfy non-null
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
