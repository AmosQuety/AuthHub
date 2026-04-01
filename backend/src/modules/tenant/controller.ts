import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";

export const getTenantConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { tenantId } = req.params;
        const { client_id } = req.query;

        let tenant;
        const select = {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            requireMfa: true,
            allowPasskeys: true,
            customDomain: true,
        };

        // 1. Resolve by client_id query param (Standard OAuth flow)
        if (client_id && typeof client_id === "string") {
            tenant = await prisma.tenant.findUnique({
                where: { clientId: client_id },
                select
            });
        } 
        // 2. Resolve by 'default' keyword
        else if (tenantId === "default") {
            tenant = await prisma.tenant.findFirst({
                orderBy: { createdAt: "asc" },
                select
            });
        }
        // 3. Resolve by UUID id
        else if (tenantId) {
            tenant = await prisma.tenant.findUnique({
                where: { id: tenantId as string },
                select
            });
        }

        if (!tenant) {
            res.status(404).json({ error: "Tenant not found" });
            return;
        }

        res.json({ tenant });
    } catch (error) {
        next(error);
    }
};

export const updateTenantConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.params.tenantId as string;
        const { name, logoUrl, primaryColor, requireMfa, allowPasskeys } = req.body;

        // In a real multi-tenant system, we'd verify that the user is an admin OF THIS specific tenant.
        // For AuthHub's current model, any global admin can edit tenants, so we assume RBAC middleware protects this route.

        let updatedTenant;
        const data = { name, logoUrl, primaryColor, requireMfa, allowPasskeys };
        const select = {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            requireMfa: true,
            allowPasskeys: true,
        };

        if (tenantId === "default") {
          const firstTenant = await prisma.tenant.findFirst({ select: { id: true } });
          if (!firstTenant) throw new Error("No tenants exist");
          
          updatedTenant = await prisma.tenant.update({
            where: { id: firstTenant.id },
            data,
            select
          });
        } else {
          updatedTenant = await prisma.tenant.update({
              where: { id: tenantId },
              data,
              select
          });
        }

        res.json({ tenant: updatedTenant, message: "Tenant configuration updated successfully" });
    } catch (error) {
        // Handle Prisma "Not Found" error gracefully
        if (error instanceof Error && error.message.includes("Record to update not found")) {
            res.status(404).json({ error: "Tenant not found" });
            return;
        }
        next(error);
    }
};
