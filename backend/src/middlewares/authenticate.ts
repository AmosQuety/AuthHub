import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../core/crypto.js";

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);

    if (!payload.sub) {
      res.status(401).json({ error: "Unauthorized: Invalid token payload" });
      return;
    }

    req.user = { sub: payload.sub };
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
