import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";

export const getTenantConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.params.tenantId as string;

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                logoUrl: true,
                primaryColor: true,
                requireMfa: true,
                allowPasskeys: true,
            }
        });

        if (!tenant) {
            res.status(404).json({ error: "Tenant not found" });
            return;
        }

        res.json({ tenant });
    } catch (error) {
        next(error);
    }
};
