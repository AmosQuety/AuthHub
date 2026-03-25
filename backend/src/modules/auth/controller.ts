import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";
import redis from "../../db/redis.js";
import { hashPassword, verifyPassword, generateTokens, verifyToken, generateMfaToken } from "../../core/crypto.js";
import { RiskEngine } from "../../core/riskEngine.js";
import { AuditService } from "../../core/audit.js";
import { BruteForceService } from "../../middlewares/rateLimiter.js";

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let { email, password, name, client_id } = req.body;
    email = email.toLowerCase();

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Resolve tenant from client_id if provided
    let tenantId: string | null = null;
    if (client_id) {
      const tenant = await prisma.tenant.findUnique({ where: { clientId: client_id }, select: { id: true } });
      if (!tenant) {
        res.status(400).json({ error: "Unknown client_id" });
        return;
      }
      tenantId = tenant.id;
    }

    // Check for existing user scoped to this tenant
    const existingUser = await prisma.user.findFirst({
      where: { email, tenantId },
    });

    if (existingUser) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user.id,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase();

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Resolve tenant from client_id if provided
    let tenantId: string | null = null;
    if (req.body.client_id) {
      const tenant = await prisma.tenant.findUnique({ where: { clientId: req.body.client_id }, select: { id: true } });
      if (tenant) tenantId = tenant.id;
    }

    // --- Brute-Force Lockout Check ---
    const lockout = await BruteForceService.getLockout(email);
    if (lockout) {
      res.status(429).json({
        error: "too_many_failures",
        message: lockout.message,
        retry_after: lockout.ttl,
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { email, tenantId },
    });

    if (!user || !user.passwordHash) {
      console.log(`[AUTH] Login failed: User not found for email ${email}`);
      // Record failure even for unknown emails to prevent user enumeration via timing
      await BruteForceService.recordFailure(email);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isValid = await verifyPassword(user.passwordHash, password);

    if (!isValid) {
      console.log(`[AUTH] Login failed: Password mismatch for email ${email}`);
      // Record this failure for per-account brute-force tracking
      await BruteForceService.recordFailure(email);
      AuditService.log({
        userId: user.id,
        action: "LOGIN_FAILED",
        status: "FAILURE",
        ipAddress: req.ip || "unknown",
        deviceInfo: req.headers["user-agent"] || "unknown",
      });
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Successful credential check — clear any brute-force counters
    await BruteForceService.reset(email);

    // --- NEW: Risk Engine Analysis ---
    const ipAddress = req.ip || "unknown";
    const deviceInfo = req.headers["user-agent"] || "unknown";

    const riskScore = await RiskEngine.calculateRiskScore({
      userId: user.id,
      ipAddress,
      userAgent: deviceInfo,
    });

    if (riskScore >= 80) {
      // HIGH RISK: Block login entirely to halt account takeover (credential stuffing)
      AuditService.log({
        userId: user.id,
        action: "LOGIN_ATTEMPT",
        status: "BLOCKED",
        ipAddress,
        deviceInfo,
        details: { reason: "High Risk Score", riskScore }
      });

      res.status(403).json({
        error: "Anomalous login detected. Access is blocked for your protection."
      });
      return;
    }

    // --- NEW: Adaptive MFA Check ---
    const mfaMethods = await prisma.mfaMethod.findMany({
      where: { userId: user.id, enabled: true },
    });

    // We check MFA if they have it enrolled OR if it's a medium risk login (which could hypothetically force an email-based OTP if we had one. 
    // Since we only have TOTP/Passkeys via enrollment, we rely on existing enrollments.)
    if (mfaMethods.length > 0 || riskScore >= 40) {
      // User has MFA enabled OR is Medium Risk. 
      // Note: If they are Medium Risk but don't actually have MFA enrolled, they will just fail the challenge step.
      // In a production enterprise system, you'd trigger a fallback like an Email/SMS Code here.

      const mfaToken = await generateMfaToken(user.id);

      res.status(200).json({
        status: "mfa_required",
        mfa_token: mfaToken,
        message: "MFA challenge required due to risk policy or user settings. Submit this token and your code to /mfa/totp/challenge or /passkey/auth/verify"
      });
      return;
    }
    // --- End MFA Check ---

    // 1. Create session record first so we have the sessionId for the token
    const sessionPayload: any = {
      userId: user.id,
      refreshTokenHash: "pending", // Temporary — updated below once we have the token
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo,
      ipAddress,
      riskScore, // Added for audit trails
    };

    const session = await prisma.session.create({
      data: sessionPayload,
    });

    // 2. Generate tokens now that we have sessionId
    const { accessToken, refreshToken } = await generateTokens(user.id, session.id, [], user.roles, user.name);

    // 3. Store hashed refresh token in the session
    const refreshTokenHash = await hashPassword(refreshToken);
    await prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    // 4. Cache user profile in Redis for fast /me lookups
    await redis.setex(`user:${user.id}:profile`, 3600, JSON.stringify({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      roles: user.roles,
    }));

    AuditService.log({
      userId: user.id,
      action: "LOGIN",
      status: "SUCCESS",
      ipAddress,
      deviceInfo,
      details: { riskScore, sessionId: session.id }
    });

    // 5. Set Refresh Token in HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        roles: user.roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.user.sub;

    // Try Redis cache first
    const cachedProfile = await redis.get(`user:${userId}:profile`);
    if (cachedProfile) {
      res.json({ user: JSON.parse(cachedProfile) });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        roles: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await redis.setex(`user:${userId}:profile`, 3600, JSON.stringify(user));
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(200).json({ message: "Logged out successfully" });
      return;
    }

    try {
      // Verify the refresh token (not just decode) to ensure it's legitimate
      const payload = await verifyToken(refreshToken);

      if (payload.sub) {
        // Delete Redis profile cache
        await redis.del(`user:${payload.sub}:profile`);

        // Target only the specific session via the sid claim embedded in the token
        const sessionId = payload.sid as string | undefined;
        if (sessionId) {
          await prisma.session.deleteMany({
            where: { id: sessionId, userId: payload.sub },
          });
        } else {
          // Fallback: if sid is missing (e.g. older token), delete all user sessions
          await prisma.session.deleteMany({ where: { userId: payload.sub } });
        }
      }
    } catch {
      // Token invalid/expired — still clear the cookie, just can't revoke server-side
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: oldRefreshToken } = req.cookies;

    if (!oldRefreshToken) {
      res.status(401).json({ error: "No refresh token provided" });
      return;
    }

    // 1. Verify token signature and expiry
    let payload;
    try {
      payload = await verifyToken(oldRefreshToken);
    } catch {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const userId = payload.sub;
    const sessionId = payload.sid as string | undefined;

    if (!userId || !sessionId) {
      res.status(401).json({ error: "Malformed refresh token" });
      return;
    }

    // 2. Find and validate the existing session
    const oldSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!oldSession || oldSession.userId !== userId) {
      // Token exists but session is dead/revoked server-side
      res.status(401).json({ error: "Session revoked" });
      return;
    }

    if (oldSession.expiresAt < new Date()) {
      res.status(401).json({ error: "Session expired" });
      return;
    }

    // Verify the hash matches (detects token theft/replay if the DB hash doesn't match the presented token)
    const isValidHash = await verifyPassword(oldSession.refreshTokenHash, oldRefreshToken);
    if (!isValidHash) {
      // THEFT DETECTED: The token is structurally valid but the DB hash does not match.
      // This means the token was already rotated and someone (an attacker) is trying to use the old, stolen one.
      console.warn(`[SECURITY] Refresh token replay detected for user ${userId}. Revoking entire family.`);

      // Nuke ALL sessions for this user to halt the attacker
      await prisma.session.deleteMany({ where: { userId } });

      AuditService.log({
        userId,
        action: "TOKEN_REFRESH",
        status: "BLOCKED",
        ipAddress: req.ip || "unknown",
        deviceInfo: req.headers["user-agent"] || "unknown",
        details: { reason: "Token Replay Detected - Family Revoked", sessionId }
      });

      res.status(401).json({ error: "Invalid refresh token. Security violation detected." });
      return;
    }

    // 3. Token Rotation — delete old session, create new one
    // We use deleteMany to avoid throwing if the session was already removed by a concurrent request
    await prisma.session.deleteMany({ where: { id: sessionId } });

    const newSession = await prisma.session.create({
      data: {
        userId: userId,
        refreshTokenHash: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Extended 7 days
        deviceInfo: oldSession.deviceInfo, // Inherit device context
        ipAddress: req.ip || "unknown",   // Update to current IP
      },
    });

    // 4. Fetch the user to retrieve current roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // 5. Generate fresh tokens linked to the new session
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(userId, newSession.id, [], user.roles, user.name);

    // 5. Hash and save new refresh token
    const newRefreshTokenHash = await hashPassword(newRefreshToken);
    await prisma.session.update({
      where: { id: newSession.id },
      data: { refreshTokenHash: newRefreshTokenHash },
    });

    // 6. Set new cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      message: "Token refreshed successfully",
    });

  } catch (error) {
    next(error);
  }
};

// --- RFC 7009: Token Revocation ---
export const revokeToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, token_type_hint } = req.body;

    if (!token) {
      res.status(400).json({ error: "token is required" });
      return;
    }

    // Attempt to decode to see if it's a refresh token we track in DB
    try {
      const payload = await verifyToken(token);

      // If it's a refresh token, destroy the session
      if (payload.sid && payload.type === "refresh") {
        await prisma.session.deleteMany({ where: { id: payload.sid as string } });

        AuditService.log({
          userId: payload.sub,
          action: "TOKEN_REVOCATION",
          status: "SUCCESS",
          details: { tokenType: "refresh", sessionId: payload.sid }
        });
      }
    } catch {
      // RFC 7009 says: "The authorization server responds with HTTP status code 200 if the token has been revoked successfully or if the client submitted an invalid token."
      // If we can't parse it, we just assume it's an access token payload that will expire on its own (stateless).
    }

    res.status(200).json({});
  } catch (error) {
    next(error);
  }
};

// --- RFC 7662: Token Introspection ---
export const introspectToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: "token is required" });
      return;
    }

    try {
      const payload = await verifyToken(token);
      res.json({
        active: true,
        sub: payload.sub,
        exp: payload.exp,
        iat: payload.iat,
        scopes: payload.scopes || [],
        client_id: payload.aud,
        roles: payload.roles || []
      });
    } catch {
      // Introspection just returns { active: false } if invalid 
      res.json({ active: false });
    }
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// Phase 10 — Email Verification & Password Reset
// =============================================================================

import { randomBytes } from "crypto";
import { sendMail, buildVerificationEmail, buildPasswordResetEmail } from "../../core/mailer.js";

// ---------------------------------------------------------------------------
// POST /api/v1/auth/verify-email/send
// Sends a verification link to the authenticated user's email.
// ---------------------------------------------------------------------------
export const sendVerificationEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ error: "Email is already verified" });
      return;
    }

    const token = randomBytes(32).toString("hex");
    const ttl = 24 * 60 * 60; // 24 hours in seconds

    await redis.setex(`email_verify:${token}`, ttl, userId);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    await sendMail({
      to: user.email,
      subject: "Verify your email — AuthHub",
      html: buildVerificationEmail(verifyUrl),
    });

    res.json({ message: "Verification email sent. Please check your inbox." });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/auth/verify-email/:token
// Consumes the token and marks the user's email as verified.
// ---------------------------------------------------------------------------
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    const userId = await redis.get(`email_verify:${token}`);
    if (!userId) {
      res.status(400).json({ error: "Invalid or expired verification token" });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    // Invalidate token immediately (single-use)
    await redis.del(`email_verify:${token}`);

    // Bust Redis profile cache so /me returns fresh data
    await redis.del(`user:${userId}:profile`);

    AuditService.log({
      userId,
      action: "EMAIL_VERIFIED",
      status: "SUCCESS",
    });

    res.json({ message: "Email verified successfully." });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/forgot-password
// Issues a password reset link. Always returns 200 to prevent email enumeration.
// ---------------------------------------------------------------------------
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    // Always respond 200 — do NOT reveal if the email exists
    // Resolve tenant context for scoped lookup
    const client_id = req.body.client_id as string | undefined;
    let tenantId: string | null = null;
    if (client_id) {
      const tenant = await prisma.tenant.findUnique({ where: { clientId: client_id }, select: { id: true } });
      if (tenant) tenantId = tenant.id;
    }

    const user = await prisma.user.findFirst({ where: { email, tenantId } });
    if (!user) {
      res.json({ message: "If that email exists, a reset link has been sent." });
      return;
    }

    const token = randomBytes(32).toString("hex");
    const ttl = 60 * 60; // 1 hour in seconds

    await redis.setex(`pwd_reset:${token}`, ttl, user.id);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await sendMail({
      to: user.email,
      subject: "Reset your password — AuthHub",
      html: buildPasswordResetEmail(resetUrl),
    });

    AuditService.log({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      status: "SUCCESS",
      ipAddress: req.ip || "unknown",
    });

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/reset-password
// Validates the reset token, updates the password, invalidates all sessions.
// ---------------------------------------------------------------------------
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: "token and password are required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const userId = await redis.get(`pwd_reset:${token}`);
    if (!userId) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Force re-login everywhere — delete all sessions
    await prisma.session.deleteMany({ where: { userId } });

    // Invalidate the reset token (single-use)
    await redis.del(`pwd_reset:${token}`);

    // Bust profile cache
    await redis.del(`user:${userId}:profile`);

    AuditService.log({
      userId,
      action: "PASSWORD_RESET",
      status: "SUCCESS",
      ipAddress: req.ip || "unknown",
    });

    res.json({ message: "Password reset successfully. Please log in with your new password." });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sessions = await prisma.session.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true,
      }
    });

    // Parse User-Agent string to structured device info for the frontend
    const parsedSessions = sessions.map(session => {
      const uaString = session.deviceInfo || "";
      let browser = "Unknown Browser";
      let os = "Unknown OS";
      let isMobile = false;

      if (uaString.includes("Firefox")) browser = "Firefox";
      else if (uaString.includes("Edg")) browser = "Edge";
      else if (uaString.includes("Chrome")) browser = "Chrome";
      else if (uaString.includes("Safari") && !uaString.includes("Chrome")) browser = "Safari";

      if (uaString.includes("Windows")) os = "Windows";
      else if (uaString.includes("Mac OS")) os = "macOS";
      else if (uaString.includes("Linux")) os = "Linux";
      else if (uaString.includes("Android")) { os = "Android"; isMobile = true; }
      else if (uaString.includes("iPhone") || uaString.includes("iPad")) { os = "iOS"; isMobile = true; }

      return {
        id: session.id,
        ipAddress: session.ipAddress,
        expiresAt: session.expiresAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
        deviceInfo: {
          browser,
          os,
          isMobile,
          rawUserAgent: uaString,
        }
      };
    });

    res.json({ sessions: parsedSessions });
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sessionId = req.params.id as string;

    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Only allow users to delete their own sessions
    if (session.userId !== req.user.sub) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await prisma.session.delete({
      where: { id: sessionId }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const logs = await prisma.auditLog.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to most recent 50 logs for performance
      select: {
        id: true,
        action: true,
        ipAddress: true,
        deviceInfo: true,
        status: true,
        details: true,
        createdAt: true,
      }
    });

    res.json({ logs });
  } catch (error) {
    next(error);
  }
};
