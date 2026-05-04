import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";
import crypto from "crypto";

export const createWebhookEndpoint = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { url, events, description } = req.body;
        const tenantId = req.user?.tenantId || null;

        if (!url || !events || !Array.isArray(events)) {
            res.status(400).json({ error: "URL and events array are required" });
            return;
        }

        // Generate a random secret for this endpoint
        const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

        const endpoint = await prisma.webhookEndpoint.create({
            data: {
                url,
                events,
                description,
                secret,
                tenantId
            }
        });

        res.status(201).json(endpoint);
    } catch (error) {
        next(error);
    }
};

export const listWebhookEndpoints = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.tenantId || null;

        const endpoints = await prisma.webhookEndpoint.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { deliveries: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json(endpoints);
    } catch (error) {
        next(error);
    }
};

export const deleteWebhookEndpoint = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId || null;

        await prisma.webhookEndpoint.delete({
            where: { id, tenantId }
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const getWebhookDeliveries = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // Endpoint ID
        const tenantId = req.user?.tenantId || null;

        const deliveries = await prisma.webhookDelivery.findMany({
            where: { 
                webhookEndpointId: id,
                endpoint: { tenantId }
            },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        res.json(deliveries);
    } catch (error) {
        next(error);
    }
};
