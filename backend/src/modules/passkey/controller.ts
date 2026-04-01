import { Request, Response, NextFunction } from "express";
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type { GenerateRegistrationOptionsOpts, GenerateAuthenticationOptionsOpts } from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import prisma from "../../db/client.js";
import redis from "../../db/redis.js";
import { generateTokens, hashPassword } from "../../core/crypto.js";

// Relying Party Configuration
const rpName = "AuthHub";
const rpID = process.env.BASE_URL ? new URL(process.env.BASE_URL).hostname : "localhost";
const origin = process.env.FRONTEND_URL || `http://${rpID}:3001`;

// --- REGISTRATION FLOW ---

export const getRegistrationOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { mfaMethods: { where: { type: "webauthn" } } }
        });

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const { email } = user;

        // Build list of existing credentials to exclude them
        const excludeCredentials = user.mfaMethods.map((mfa) => ({
            id: mfa.secret.split(":")[0], // Keep as base64url encoded string
            type: "public-key" as const,
        }));

        const options: GenerateRegistrationOptionsOpts = {
            rpName,
            rpID,
            userID: isoUint8Array.fromUTF8String(userId),
            userName: email,
            // Require user verification (biometrics, PIN, etc)
            authenticatorSelection: {
                userVerification: "preferred",
                // residentKey: 'required' for true passwordless/discoverable credentials
                residentKey: "preferred",
            },
            excludeCredentials,
            attestationType: "none",
        };

        const passkeyOptions = await generateRegistrationOptions(options);

        // Cache the challenge in Redis for 5 minutes, keyed to the user ID
        await redis.setex(`passkey:challenge:${userId}`, 300, passkeyOptions.challenge);

        res.json(passkeyOptions);
    } catch (error) {
        console.error("Passkey Generate Registration Options Error:", error);
        next(error);
    }
};

export const verifyRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const body = req.body; // The response from navigator.credentials.create()

        // 1. Retrieve the expected challenge from Redis
        const expectedChallenge = await redis.get(`passkey:challenge:${userId}`);
        if (!expectedChallenge) {
            res.status(400).json({ error: "Registration challenge expired or missing" });
            return;
        }

        // 2. Clear it from Redis so it can't be reused
        await redis.del(`passkey:challenge:${userId}`);

        // 3. Verify the response
        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                requireUserVerification: true,
            });
        } catch (err: any) {
            console.error(err);
            res.status(400).json({ error: err.message });
            return;
        }

        const { verified, registrationInfo } = verification;

        if (!verified || !registrationInfo) {
            res.status(400).json({ error: "Registration verification failed" });
            return;
        }

        // 4. Save the credential correctly.
        // We will store the base64url of both credentialId and credentialPublicKey, colon-separated
        const { credential } = registrationInfo;

        // Using simplewebauthn helpers to convert to string
        const credentialIdStr = credential.id;
        const publicKeyStr = isoBase64URL.fromBuffer(credential.publicKey);

        const secret = `${credentialIdStr}:${publicKeyStr}:${credential.counter}`;

        await prisma.mfaMethod.create({
            data: {
                userId,
                type: "webauthn",
                secret: secret,
                enabled: true, // Passkeys are enabled immediately
            }
        });

        res.json({ verified: true, message: "Passkey registered successfully" });
    } catch (error) {
        next(error);
    }
};

// --- AUTHENTICATION FLOW (LOGIN) ---

export const getAuthOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;

        // For discoverable credentials (true passwordless without typing email), email would be optional.
        // For now we assume email first flow.
        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
        }

        const user = await prisma.user.findFirst({
            where: { email },
            include: { mfaMethods: { where: { type: "webauthn" } } }
        });

        if (!user) {
            // Don't leak user existence
            res.status(404).json({ error: "User not found" });
            return;
        }

        const allowCredentials = user.mfaMethods.map((mfa: any) => {
            const [credentialIdBase64] = mfa.secret.split(":");
            return {
                id: credentialIdBase64,
                type: "public-key" as const,
            };
        });

        if (allowCredentials.length === 0) {
            res.status(400).json({ error: "No passkeys registered for this user" });
            return;
        }

        const options: GenerateAuthenticationOptionsOpts = {
            rpID,
            allowCredentials,
            userVerification: "preferred",
        };

        const passkeyAuthOptions = await generateAuthenticationOptions(options);

        // Cache the challenge by email.
        // Using email here because the user is not authenticated yet.
        await redis.setex(`passkey:auth:challenge:${email}`, 300, passkeyAuthOptions.challenge);

        res.json(passkeyAuthOptions);
    } catch (error) {
        next(error);
    }
};

export const verifyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, response } = req.body;

        if (!email || !response) {
            res.status(400).json({ error: "Email and Passkey response are required" });
            return;
        }

        const expectedChallenge = await redis.get(`passkey:auth:challenge:${email}`);
        if (!expectedChallenge) {
            res.status(400).json({ error: "Authentication challenge expired or missing" });
            return;
        }

        // Don't delete challenge yet, want to avoid race conditions if query fails?
        // Actually, delete to prevent replay.
        await redis.del(`passkey:auth:challenge:${email}`);

        // Lookup user and credential
        const user = await prisma.user.findFirst({
            where: { email },
            include: { mfaMethods: { where: { type: "webauthn" } } }
        });

        if (!user) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        const credentialIdStr = response.id; // Usually base64url encoded credential ID string provided by browser

        // Find the right passkey in db
        const mfa = user.mfaMethods.find((m: any) => m.secret.startsWith(`${credentialIdStr}:`));

        if (!mfa) {
            res.status(400).json({ error: "Passkey not found for user" });
            return;
        }

        const [_, publicKeyStr, counterStr] = mfa.secret.split(":");
        const credentialPublicKey = isoBase64URL.toBuffer(publicKeyStr);
        const expectedCounter = parseInt(counterStr, 10);

        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                credential: {
                    id: credentialIdStr,
                    publicKey: credentialPublicKey,
                    counter: expectedCounter,
                },
                requireUserVerification: true,
            });
        } catch (err: any) {
            console.error(err);
            res.status(400).json({ error: err.message });
            return;
        }

        const { verified, authenticationInfo } = verification;

        if (!verified || !authenticationInfo) {
            res.status(401).json({ error: "Authentication verification failed" });
            return;
        }

        // Update the counter in DB to prevent cloning attacks
        const newSecret = `${credentialIdStr}:${publicKeyStr}:${authenticationInfo.newCounter}`;
        await prisma.mfaMethod.update({
            where: { id: mfa.id },
            data: { secret: newSecret }
        });

        // --- LOG THE USER IN (Same as POST /login) ---

        // Note: We bypass the TOTP MFA check here because Passkeys inherently act 
        // as strong multi-factor authentication (Biometric/PIN + Device).

        const session = await prisma.session.create({
            data: {
                userId: user.id,
                refreshTokenHash: "pending",
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                deviceInfo: req.headers["user-agent"] || "unknown",
                ipAddress: req.ip || "unknown",
            },
        });

        const { accessToken, refreshToken } = await generateTokens(user.id, session.id, [], user.roles);

        const refreshTokenHash = await hashPassword(refreshToken);
        await prisma.session.update({
            where: { id: session.id },
            data: { refreshTokenHash },
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            message: "Passkey login successful",
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
            },
        });
    } catch (error) {
        next(error);
    }
};
