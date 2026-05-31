import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";
import { generateTokens, hashPassword, generateMfaToken } from "../../core/crypto.js";
import crypto from "crypto";

/** Creates a URL-safe slug from a string: "My App" → "my-app" */
function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const FRONTEND_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3001";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BASE_URL}/api/v1/auth/google/callback`;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || `${BASE_URL}/api/v1/auth/github/callback`;

// --- GOOGLE OAUTH ---

export const googleLogin = (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: "Google OAuth not configured" });

    // Pass the AuthHub client_id, mode, and user_id in the state so we know the intent
    const { client_id, mode, user_id } = req.query;
    const state = Buffer.from(JSON.stringify({ client_id, mode, user_id })).toString('base64url');

    const redirectUri = GOOGLE_CALLBACK_URL;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=profile email&state=${state}`;

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
        const redirectUri = GOOGLE_CALLBACK_URL;

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
        const { id: rawGoogleId, email, verified_email, name: googleName, picture: profilePicture } = profileData;
        const googleId = String(rawGoogleId);
        if (!email) throw new Error("No email found associated with Google account");
        const normalizedEmail = String(email).toLowerCase();

        const stateStr = req.query.state as string;
        let tenantId: string | null = null;
        let mode: string | null = null;
        let linkingUserId: string | null = null;

        if (stateStr) {
            try {
                const parsedState = JSON.parse(Buffer.from(stateStr, 'base64url').toString('utf-8'));
                mode = parsedState.mode;
                linkingUserId = parsedState.user_id;
                if (parsedState.client_id) {
                    const tenant = await prisma.tenant.findUnique({ where: { clientId: parsedState.client_id }, select: { id: true } });
                    if (tenant) tenantId = tenant.id;
                }
            } catch (e) {
                console.error("Failed to parse OAuth state:", e);
            }
        }

        // --- LINKING MODE LOGIC ---
        if (mode === "link" && linkingUserId) {
            const existingLink = await prisma.authProvider.findUnique({
                where: { provider_providerId: { provider: "google", providerId: googleId } }
            });

            if (existingLink && existingLink.userId !== linkingUserId) {
                res.redirect(`${FRONTEND_URL}/dashboard?error=provider_already_linked_elsewhere`);
                return;
            }

            await prisma.authProvider.upsert({
                where: { provider_providerId: { provider: "google", providerId: googleId } },
                update: { providerEmail: normalizedEmail },
                create: {
                    userId: linkingUserId,
                    provider: "google",
                    providerId: googleId,
                    providerEmail: normalizedEmail,
                },
            });

            res.redirect(`${FRONTEND_URL}/dashboard?success=account_linked`);
            return;
        }

        let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        // AUTO-TENANT: If we need to create a fresh account and no tenantId is resolved,
        // create a new one for that account.
        if (!tenantId && !user) {
            const tenantName = `${googleName || normalizedEmail.split('@')[0]}'s Workspace`;
            const newTenant = await prisma.tenant.create({
                data: {
                    name: tenantName,
                    clientId: `${slugify(tenantName)}_${crypto.randomBytes(4).toString('hex')}`,
                }
            });
            tenantId = newTenant.id;
        }

        if (!user) {
            // If we are in 'login' mode, do NOT auto-create. Redirect with error.
            if (mode === "login") {
                res.redirect(`${FRONTEND_URL}/login?error=account_not_found`);
                return;
            }

            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    emailVerified: verified_email,
                    name: googleName || null,
                    profilePictureUrl: profilePicture || null,
                    ...(tenantId ? { tenantId } : {}),
                },
            });
        } else {
            // Update existing user with profile picture and name/emailVerified if missing
            const updateData: any = {};
            if (!user.profilePictureUrl && profilePicture) updateData.profilePictureUrl = profilePicture;
            if (!user.name && googleName) updateData.name = googleName;
            if (!user.emailVerified && verified_email) updateData.emailVerified = verified_email;

            if (Object.keys(updateData).length > 0) {
                user = await prisma.user.update({ where: { id: user.id }, data: updateData });
            }
        }

        // Upsert AuthProvider link
        await prisma.authProvider.upsert({
            where: { provider_providerId: { provider: "google", providerId: googleId } },
            update: { providerEmail: normalizedEmail },
            create: {
                userId: user.id,
                provider: "google",
                providerId: googleId,
                providerEmail: normalizedEmail,
            },
        });

        // Check for MFA
        const mfa = await prisma.mfaMethod.findFirst({
            where: { userId: user.id, type: "totp", enabled: true }
        });

        if (mfa) {
            const mfaToken = await generateMfaToken(user.id);
            res.redirect(`${FRONTEND_URL}/mfa-challenge?mfa_token=${mfaToken}`);
            return;
        }

        // Check if profile is complete (name + phone + ToS + Privacy acceptance)
        const isProfileComplete = Boolean(user.name && user.phoneNumber && user.tosAcceptedAt && (user as any).privacyAcceptedAt);

        // 4. Create Session & Tokens
        const sessionId = crypto.randomUUID();

        const entitlements = await prisma.entitlement.findMany({
            where: { userId: user.id, status: "active" },
            select: { planId: true },
        });
        const entitlementScopes = entitlements.map(e => `plan:${e.planId}`);

        const { accessToken, refreshToken } = await generateTokens(user.id, sessionId, ["openid", "profile", "email"], user.roles, undefined, undefined, entitlementScopes);
        const refreshTokenHash = await hashPassword(refreshToken);

        const session = await prisma.session.create({
            data: {
                id: sessionId,
                userId: user.id,
                refreshTokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                deviceInfo: req.headers["user-agent"] || "unknown",
                ipAddress: req.ip || "unknown",
            },
        });

        // 5. Send Cookies & Redirect to App
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Set short-lived cookie for access token handover (secure, but readable by JS)
        res.cookie("accessToken", accessToken, {
            httpOnly: false, // Must be false so frontend JS can read it
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 5 * 60 * 1000, // 5 minutes
        });

        // If profile is incomplete, redirect to completion page instead of dashboard
        // Include a short-lived access token in the redirect URL so cross-domain
        // frontends can consume it (short-lived handover). Token is URL-encoded.
        if (!isProfileComplete) {
            res.redirect(`${FRONTEND_URL}/auth/complete-profile?access_token=${encodeURIComponent(accessToken)}`);
        } else {
            res.redirect(`${FRONTEND_URL}/login/success?access_token=${encodeURIComponent(accessToken)}`);
        }
    } catch (error) {
        console.error("Google OAuth Error:", error);
        res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
};

// --- GITHUB OAUTH ---

export const githubLogin = (req: Request, res: Response) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: "GitHub OAuth not configured" });

    const { client_id, mode, user_id } = req.query;
    const state = Buffer.from(JSON.stringify({ client_id, mode, user_id })).toString('base64url');

    const redirectUri = GITHUB_CALLBACK_URL;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${state}`;

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
        const redirectUri = GITHUB_CALLBACK_URL;

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
                redirect_uri: redirectUri
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || tokenData.error) {
            console.error("GitHub Exchange Failed:", {
                status: tokenResponse.status,
                error: tokenData.error,
                description: tokenData.error_description,
                uri: redirectUri
            });
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

        const normalizedEmail = String(email).toLowerCase();

    const { id: rawGithubId, name: githubName, avatar_url: profilePicture } = profileData;
        const githubId = String(rawGithubId);

        const stateStr = req.query.state as string;
        let tenantId: string | null = null;
        let mode: string | null = null;
        let linkingUserId: string | null = null;

        if (stateStr) {
            try {
                const parsedState = JSON.parse(Buffer.from(stateStr, 'base64url').toString('utf-8'));
                mode = parsedState.mode;
                linkingUserId = parsedState.user_id;
                if (parsedState.client_id) {
                    const tenant = await prisma.tenant.findUnique({ where: { clientId: parsedState.client_id }, select: { id: true } });
                    if (tenant) tenantId = tenant.id;
                }
            } catch (e) {
                console.error("Failed to parse OAuth state:", e);
            }
        }

        // --- LINKING MODE LOGIC ---
        if (mode === "link" && linkingUserId) {
            const existingLink = await prisma.authProvider.findUnique({
                where: { provider_providerId: { provider: "github", providerId: githubId } }
            });

            if (existingLink && existingLink.userId !== linkingUserId) {
                res.redirect(`${FRONTEND_URL}/dashboard?error=provider_already_linked_elsewhere`);
                return;
            }

            await prisma.authProvider.upsert({
                where: { provider_providerId: { provider: "github", providerId: githubId } },
                update: { providerEmail: email },
                create: {
                    userId: linkingUserId,
                    provider: "github",
                    providerId: githubId,
                    providerEmail: email,
                },
            });

            res.redirect(`${FRONTEND_URL}/dashboard?success=account_linked`);
            return;
        }

        let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        // AUTO-TENANT: If we need to create a fresh account and no tenantId is resolved,
        // create a new one for that account.
        if (!tenantId && !user) {
            const tenantName = `${githubName || normalizedEmail.split('@')[0]}'s Workspace`;
            const newTenant = await prisma.tenant.create({
                data: {
                    name: tenantName,
                    clientId: `${slugify(tenantName)}_${crypto.randomBytes(4).toString('hex')}`,
                }
            });
            tenantId = newTenant.id;
        }

        if (!user) {
            // If we are in 'login' mode, do NOT auto-create. Redirect with error.
            if (mode === "login") {
                res.redirect(`${FRONTEND_URL}/login?error=account_not_found`);
                return;
            }

            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    emailVerified: true, // GitHub verified it
                    name: githubName || null,
                    profilePictureUrl: profilePicture || null,
                    ...(tenantId ? { tenantId } : {}),
                },
            });
        } else {
            // Update existing user with profile picture and name/emailVerified if missing
            const updateData: any = {};
            if (!user.profilePictureUrl && profilePicture) updateData.profilePictureUrl = profilePicture;
            if (!user.name && githubName) updateData.name = githubName;
            if (!user.emailVerified) updateData.emailVerified = true; // GitHub verified email source

            if (Object.keys(updateData).length > 0) {
                user = await prisma.user.update({ where: { id: user.id }, data: updateData });
            }
        }

        await prisma.authProvider.upsert({
            where: { provider_providerId: { provider: "github", providerId: githubId } },
            update: { providerEmail: normalizedEmail },
            create: {
                userId: user.id,
                provider: "github",
                providerId: githubId,
                providerEmail: normalizedEmail,
            },
        });



        // Check for MFA
        const mfa = await prisma.mfaMethod.findFirst({
            where: { userId: user.id, type: "totp", enabled: true }
        });

        if (mfa) {
            const mfaToken = await generateMfaToken(user.id);
            res.redirect(`${FRONTEND_URL}/mfa-challenge?mfa_token=${mfaToken}`);
            return;
        }

        // Check if profile is complete (name + phone + ToS + Privacy acceptance)
        const isProfileComplete = Boolean(user.name && user.phoneNumber && user.tosAcceptedAt && (user as any).privacyAcceptedAt);

        // 4. Create Session
        const sessionId = crypto.randomUUID();

        const entitlements = await prisma.entitlement.findMany({
            where: { userId: user.id, status: "active" },
            select: { planId: true },
        });
        const entitlementScopes = entitlements.map(e => `plan:${e.planId}`);

        // Safety: Ensure roles is a clean array of strings
        const userRoles = Array.isArray(user.roles) ? [...user.roles] : ["USER"];
        
        console.log(`[GITHUB SUCCESS] Resolving session for ${user.email} with roles:`, userRoles);

        const { accessToken, refreshToken } = await generateTokens(user.id, sessionId, ["openid", "profile", "email"], userRoles, user.name, undefined, entitlementScopes);
        const refreshTokenHash = await hashPassword(refreshToken);

        const session = await prisma.session.create({
            data: {
                id: sessionId,
                userId: user.id,
                refreshTokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                deviceInfo: req.headers["user-agent"] || "unknown",
                ipAddress: req.ip || "unknown",
            },
        });

        // 5. Send Cookies & Redirect
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Set short-lived cookie for access token handover
        res.cookie("accessToken", accessToken, {
            httpOnly: false,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 5 * 60 * 1000,
        });

        // If profile is incomplete, redirect to completion page instead of dashboard
        // Include a short-lived access token in the redirect URL so cross-domain
        // frontends can consume it (short-lived handover). Token is URL-encoded.
        if (!isProfileComplete) {
            res.redirect(`${FRONTEND_URL}/auth/complete-profile?access_token=${encodeURIComponent(accessToken)}`);
        } else {
            res.redirect(`${FRONTEND_URL}/login/success?access_token=${encodeURIComponent(accessToken)}`);
        }
    } catch (error) {
        console.error("GitHub OAuth Error:", error);
        res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
};
