import { Request, Response, NextFunction } from "express";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// @ts-ignore
const { authenticator } = require("otplib");
import * as qrcode from "qrcode";
import prisma from "../../db/client.js";
import { verifyMfaToken, generateTokens, hashPassword } from "../../core/crypto.js";

// --- ENROLL TOTP ---
export const enrollTotp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const appName = process.env.BASE_URL?.split("://")[1] || "AuthHub";
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        // Check if TOTP is already enabled
        const existingMfa = await prisma.mfaMethod.findFirst({
            where: { userId, type: "totp" }
        });

        if (existingMfa && existingMfa.enabled) {
            res.status(400).json({ error: "TOTP is already enabled for this account" });
            return;
        }

        // Generate Secret
        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(user.email, appName, secret);
        const qrCodeDataUri = await qrcode.toDataURL(otpauthUrl);

        // Save un-enabled secret
        if (existingMfa) {
            await prisma.mfaMethod.update({
                where: { id: existingMfa.id },
                data: { secret, enabled: false }
            });
        } else {
            await prisma.mfaMethod.create({
                data: {
                    userId,
                    type: "totp",
                    secret,
                    enabled: false
                }
            });
        }

        res.json({
            secret, // Usually shouldn't expose, but good for manual entry in authenticator apps
            qrCodeDataUri,
            message: "Scan this QR code with your authenticator app, then call /verify with the generated code."
        });
    } catch (error) {
        next(error);
    }
};

// --- VERIFY & ENABLE TOTP ---
export const verifyTotp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { code } = req.body;
        if (!code) {
            res.status(400).json({ error: "Code is required" });
            return;
        }

        const mfa = await prisma.mfaMethod.findFirst({
            where: { userId, type: "totp" }
        });

        if (!mfa) {
            res.status(404).json({ error: "TOTP enrollment not found. Call /enroll first." });
            return;
        }

        if (mfa.enabled) {
            res.status(400).json({ error: "TOTP is already enabled." });
            return;
        }

        const isValid = authenticator.verify({ token: code, secret: mfa.secret });

        if (!isValid) {
            res.status(400).json({ error: "Invalid TOTP code." });
            return;
        }

        // Mark as enabled
        await prisma.mfaMethod.update({
            where: { id: mfa.id },
            data: { enabled: true }
        });

        res.json({ message: "TOTP successfully enabled." });
    } catch (error) {
        next(error);
    }
};

// --- CHALLENGE TOTP (DURING LOGIN) ---
export const challengeTotp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { mfa_token, code } = req.body;

        if (!mfa_token || !code) {
            res.status(400).json({ error: "mfa_token and code are required" });
            return;
        }

        // 1. Verify the temporary 5-min MFA token
        let payload;
        try {
            payload = await verifyMfaToken(mfa_token);
        } catch (e) {
            res.status(401).json({ error: "Invalid or expired MFA token" });
            return;
        }

        const userId = payload.sub;
        if (!userId) {
            res.status(401).json({ error: "Invalid MFA token payload" });
            return;
        }

        // 2. Load standard TOTP configuration
        const mfa = await prisma.mfaMethod.findFirst({
            where: { userId, type: "totp", enabled: true }
        });

        if (!mfa) {
            res.status(400).json({ error: "TOTP not enabled for this user" });
            return;
        }

        // 3. Verify Code
        const isValid = authenticator.verify({ token: code, secret: mfa.secret });

        if (!isValid) {
            res.status(400).json({ error: "Invalid TOTP code" });
            return;
        }

        // 4. Success! Issue standard tokens (same logic as end of /login)
        const session = await prisma.session.create({
            data: {
                userId,
                refreshTokenHash: "pending",
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                deviceInfo: req.headers["user-agent"] || "unknown",
                ipAddress: req.ip || "unknown",
            },
        });

        const { accessToken, refreshToken } = await generateTokens(userId, session.id);

        const refreshTokenHash = await hashPassword(refreshToken);
        await prisma.session.update({
            where: { id: session.id },
            data: { refreshTokenHash },
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: 900,
        });
    } catch (error) {
        next(error);
    }
};
