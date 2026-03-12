import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";
import { generateTokens } from "../../core/crypto.js";
import { hashPassword } from "../../core/crypto.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// --- GOOGLE OAUTH ---

export const googleLogin = (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: "Google OAuth not configured" });

    const redirectUri = `${BASE_URL}/api/v1/auth/google/callback`;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=profile email`;

    res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { code } = req.query;
        if (!code) {
            res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
            return;
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${BASE_URL}/api/v1/auth/google/callback`;

        // 1. Exchange Auth Code for Tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code: String(code),
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error(tokenData.error_description || "Failed to fetch Google token");

        // 2. Fetch User Profile
        const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const profileData = await profileResponse.json();
        if (!profileResponse.ok) throw new Error("Failed to fetch Google profile");

        // 3. Upsert User & AuthProvider in DB
        const { id: googleId, email, verified_email } = profileData;

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    emailVerified: verified_email,
                },
            });
        }

        // Upsert AuthProvider link
        await prisma.authProvider.upsert({
            where: { provider_providerId: { provider: "google", providerId: googleId } },
            update: { providerEmail: email },
            create: {
                userId: user.id,
                provider: "google",
                providerId: googleId,
                providerEmail: email,
            },
        });

        // 4. Create Session & Tokens
        const session = await prisma.session.create({
            data: {
                userId: user.id,
                refreshTokenHash: "pending",
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                deviceInfo: req.headers["user-agent"] || "unknown",
                ipAddress: req.ip || "unknown",
            },
        });

        const { accessToken, refreshToken } = await generateTokens(user.id, session.id, ["openid", "profile", "email"]);

        await prisma.session.update({
            where: { id: session.id },
            data: { refreshTokenHash: await hashPassword(refreshToken) },
        });

        // 5. Send Cookies & Redirect to App
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect(`${FRONTEND_URL}/login/success?access_token=${accessToken}`);
    } catch (error) {
        console.error("Google OAuth Error:", error);
        res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
};

// --- GITHUB OAUTH ---

export const githubLogin = (req: Request, res: Response) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: "GitHub OAuth not configured" });

    const redirectUri = `${BASE_URL}/api/v1/auth/github/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;

    res.redirect(url);
};

export const githubCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { code } = req.query;
        if (!code) {
            res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
            return;
        }

        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        // 1. Exchange Auth Code for tokens
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || tokenData.error) {
            throw new Error(tokenData.error_description || "Failed to fetch GitHub token");
        }

        // 2. Fetch User Profile
        const profileResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        const profileData = await profileResponse.json();
        if (!profileResponse.ok) throw new Error("Failed to fetch GitHub profile");

        // GitHub doesn't always return the email in the profile if it's private.
        // Fetch emails explicitly if needed:
        let email = profileData.email;
        if (!email) {
            const emailResponse = await fetch("https://api.github.com/user/emails", {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: "application/vnd.github.v3+json",
                },
            });
            const emails = await emailResponse.json();
            const primaryEmailObj = emails.find((e: any) => e.primary) || emails[0];
            email = primaryEmailObj?.email;
        }

        if (!email) throw new Error("No email found associated with GitHub account");

        // 3. Upsert User & AuthProvider
        const githubId = String(profileData.id);

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    emailVerified: true, // GitHub verified it
                },
            });
        }

        await prisma.authProvider.upsert({
            where: { provider_providerId: { provider: "github", providerId: githubId } },
            update: { providerEmail: email },
            create: {
                userId: user.id,
                provider: "github",
                providerId: githubId,
                providerEmail: email,
            },
        });

        // 4. Create Session
        const session = await prisma.session.create({
            data: {
                userId: user.id,
                refreshTokenHash: "pending",
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                deviceInfo: req.headers["user-agent"] || "unknown",
                ipAddress: req.ip || "unknown",
            },
        });

        const { accessToken, refreshToken } = await generateTokens(user.id, session.id, ["openid", "profile", "email"]);

        await prisma.session.update({
            where: { id: session.id },
            data: { refreshTokenHash: await hashPassword(refreshToken) },
        });

        // 5. Send Cookies & Redirect
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect(`${FRONTEND_URL}/login/success?access_token=${accessToken}`);
    } catch (error) {
        console.error("GitHub OAuth Error:", error);
        res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
};
