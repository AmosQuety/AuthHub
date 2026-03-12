import { Request, Response, NextFunction } from "express";

export const requireRole = (requiredRole: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Requires that the authenticate middleware has already run and populated req.user
        if (!req.user || !req.user.roles) {
            res.status(403).json({ error: "Forbidden: Missing role information" });
            return;
        }

        const { roles } = req.user as any;

        if (!roles.includes(requiredRole)) {
            res.status(403).json({ error: `Forbidden: Requires ${requiredRole} role` });
            return;
        }

        next();
    };
};
