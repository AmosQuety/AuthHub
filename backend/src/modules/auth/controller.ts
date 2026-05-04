import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";
import redis from "../../db/redis.js";
import { hashPassword, verifyPassword as verifyPasswordCrypto, generateTokens, verifyToken, generateMfaToken } from "../../core/crypto.js";
import { RiskEngine } from "../../core/riskEngine.js";
import { AuditService } from "../../core/audit.js";
import { BruteForceService } from "../../middlewares/rateLimiter.js";
import { webhookService } from "../../services/webhook.service.js";
import logger from "../../core/logger.js";
import crypto, { randomBytes } from "crypto";
import { sendMail, buildVerificationEmail, buildPasswordResetEmail } from "../../core/mailer.js";

/** Creates a URL-safe slug from a string: "My App" → "my-app" */
function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

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

    // AUTO-TENANT: If no tenantId is resolved (Direct Platform Signup), create a new one
    if (!tenantId) {
      const tenantName = `${name || email.split('@')[0]}'s Workspace`;
      const newTenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          clientId: `${slugify(tenantName)}_${crypto.randomBytes(4).toString('hex')}`,
        }
      });
      tenantId = newTenant.id;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        tenantId: tenantId!,
      },
    });

    // Trigger Webhook
    await webhookService.dispatch({
      event: "user.created",
      payload: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        createdAt: user.createdAt
      },
      tenantId: user.tenantId || undefined
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
      logger.info({ email }, "login_failed_user_not_found");
      // Record failure even for unknown emails to prevent user enumeration via timing
      await BruteForceService.recordFailure(email);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isValid = await verifyPasswordCrypto(user.passwordHash, password);

    if (!isValid) {
      logger.info({ email, userId: user.id }, "login_failed_password_mismatch");
      // Record this failure for per-account brute-force tracking
      await BruteForceService.recordFailure(email);
      AuditService.log({
        userId: user.id,
        action: "LOGIN_FAILED",
        status: "FAILURE",
        ipAddress: req.ip || "unknown",
        deviceInfo: String(req.headers["user-agent"] || "unknown"),
      });
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Successful credential check — clear any brute-force counters
    await BruteForceService.reset(email);

    // --- NEW: Risk Engine Analysis ---
    const ipAddress = req.ip || "unknown";
    const userAgent = req.headers["user-agent"];
    const deviceInfo = Array.isArray(userAgent) ? userAgent[0] : (userAgent || "unknown");

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

    if (mfaMethods.length > 0 || riskScore >= 40) {
      const mfaToken = await generateMfaToken(user.id);

      res.status(200).json({
        status: "mfa_required",
        mfa_token: mfaToken,
        message: "MFA challenge required due to risk policy or user settings."
      });
      return;
    }
    // --- End MFA Check ---

    // 1. Manually generate sessionId for atomicity
    const sessionId = crypto.randomUUID();

    // 2. Lookup entitlements for token generation
    const entitlements = await prisma.entitlement.findMany({
      where: { userId: user.id, status: "active" },
      select: { planId: true },
    });
    const entitlementScopes = entitlements.map(e => `plan:${e.planId}`);

    const { accessToken, refreshToken } = await generateTokens(user.id, sessionId, [], user.roles, user.name, undefined, entitlementScopes);
    const refreshTokenHash = await hashPassword(refreshToken);

    const session = await prisma.$transaction(async (tx) => {
      // 4. Create session record atomically
      return await tx.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          deviceInfo,
          ipAddress,
          riskScore,
        },
      });
    });

    // 4. Cache user profile in Redis for fast /me lookups
    await redis.setex(`hub:user:${user.id}:profile`, 3600, JSON.stringify({
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
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.set("Cache-Control", "no-store");
    res.set("Pragma", "no-cache");

    // Trigger Webhook
    await webhookService.dispatch({
      event: "login.success",
      payload: {
        id: user.id,
        email: user.email,
        sessionId,
        ipAddress: req.ip || "unknown",
        deviceInfo: String(req.headers["user-agent"] || "unknown")
      },
      tenantId: user.tenantId || undefined
    });

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        roles: user.roles,
        sid: sessionId,
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
    const cachedProfile = await redis.get(`hub:user:${userId}:profile`);
    if (cachedProfile) {
      const profile = JSON.parse(cachedProfile);
      console.log(`[ME DIAGNOSTIC] Found cached profile for ${userId}. Roles:`, profile.roles);
      
      // Self-healing cache: if the cached profile is missing passwordHash (from old code version), bypass cache
      if (Object.prototype.hasOwnProperty.call(profile, 'passwordHash') && Object.prototype.hasOwnProperty.call(profile, 'mfaMethods')) {
        res.json({ 
          user: {
            ...profile,
            hasPassword: !!profile.passwordHash,
            mfaEnabled: profile.mfaMethods?.some((m: any) => m.enabled && m.type === 'totp') || false,
            clientCount: profile._count?.ownedClients || 0,
            providers: profile.authProviders?.map((p: any) => ({ id: p.id, name: p.provider })) || [],
            sid: req.user.sid
          } 
        });
        return;
      }
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
        passwordHash: true,
        authProviders: {
          select: { id: true, provider: true }
        },
        mfaMethods: {
          select: { type: true, enabled: true }
        },
        _count: {
          select: { ownedClients: true }
        }
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    console.log(`[ME DIAGNOSTIC] DB profile fetched for ${userId}. Roles:`, user.roles);

    // Cache the whole user object including passwordHash (for boolean check) and providers
    await redis.setex(`hub:user:${userId}:profile`, 3600, JSON.stringify(user));
    
    const { passwordHash, authProviders, mfaMethods, _count, ...userWithoutPass } = user;

    res.json({ 
      user: {
        ...userWithoutPass,
        hasPassword: !!passwordHash,
        mfaEnabled: mfaMethods.some(m => m.enabled && m.type === "totp"),
        clientCount: _count.ownedClients,
        providers: authProviders.map(p => ({ id: p.id, name: p.provider })),
        sid: req.user.sid
      } 
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.sub;
    const { name, phoneNumber } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(phoneNumber !== undefined ? { phoneNumber: phoneNumber.trim() } : {}),
      },
    });

    // Clear Redis cache so /me reflects changes immediately
    await redis.del(`hub:user:${userId}:profile`);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
      }
    });
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
      const payload = await verifyToken(refreshToken);

      if (payload.sub) {
        await redis.del(`hub:user:${payload.sub}:profile`);

        const sessionId = payload.sid as string | undefined;
        if (sessionId) {
          await prisma.session.deleteMany({
            where: { id: sessionId, userId: payload.sub },
          });
        } else {
          await prisma.session.deleteMany({ where: { userId: payload.sub } });
        }
      }
    } catch {
      // Token invalid
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

    const oldSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!oldSession || oldSession.userId !== userId) {
      res.status(401).json({ error: "Session revoked" });
      return;
    }

    if (oldSession.expiresAt < new Date()) {
      res.status(401).json({ error: "Session expired" });
      return;
    }

    const isValidHash = await verifyPasswordCrypto(oldSession.refreshTokenHash, oldRefreshToken);
    if (!isValidHash) {
      logger.warn({ userId, sessionId }, "refresh_token_replay_detected");
      await prisma.session.deleteMany({ where: { userId } });

      AuditService.log({
        userId,
        action: "TOKEN_REFRESH",
        status: "BLOCKED",
        ipAddress: req.ip || "unknown",
        deviceInfo: String(req.headers["user-agent"] || "unknown"),
        details: { reason: "Token Replay Detected - Family Revoked", sessionId }
      });

      res.status(401).json({ error: "Invalid refresh token. Security violation detected." });
      return;
    }

    const newSessionId = crypto.randomUUID();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const entitlements = await prisma.entitlement.findMany({
      where: { userId: userId, status: "active" },
      select: { planId: true },
    });
    const entitlementScopes = entitlements.map(e => `plan:${e.planId}`);

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(userId, newSessionId, [], user.roles, user.name, undefined, entitlementScopes);
    const newRefreshTokenHash = await hashPassword(newRefreshToken);

    await prisma.$transaction(async (tx) => {
      await tx.session.create({
        data: {
          id: newSessionId,
          userId: userId,
          refreshTokenHash: newRefreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          deviceInfo: oldSession.deviceInfo,
          ipAddress: req.ip || "unknown",
        },
      });

      await tx.session.deleteMany({ where: { id: sessionId } });
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.set("Cache-Control", "no-store");
    res.set("Pragma", "no-cache");
    res.json({
      accessToken,
      message: "Token refreshed successfully",
    });

  } catch (error) {
    next(error);
  }
};

export const revokeToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: "token is required" });
      return;
    }

    try {
      const payload = await verifyToken(token);

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
      // Token invalid
    }

    res.status(200).json({});
  } catch (error) {
    next(error);
  }
};

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
      res.json({ active: false });
    }
  } catch (error) {
    next(error);
  }
};

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
    const ttl = 24 * 60 * 60;

    await redis.setex(`hub:email_verify:${token}`, ttl, userId);

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

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    const userId = await redis.get(`hub:email_verify:${token}`);
    if (!userId) {
      res.status(400).json({ error: "Invalid or expired verification token" });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    await redis.del(`hub:email_verify:${token}`);
    await redis.del(`hub:user:${userId}:profile`);

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

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

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
    const ttl = 60 * 60;

    await redis.setex(`hub:pwd_reset:${token}`, ttl, user.id);

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

    const userId = await redis.get(`hub:pwd_reset:${token}`);
    if (!userId) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await prisma.session.deleteMany({ where: { userId } });
    await redis.del(`hub:pwd_reset:${token}`);
    await redis.del(`hub:user:${userId}:profile`);

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

export const updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.sub;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // If user already has a password, they MUST provide the current one to change it.
    if (user.passwordHash) {
      if (!currentPassword) {
        res.status(400).json({ error: "Current password is required to set a new one." });
        return;
      }
      const isValid = await verifyPasswordCrypto(user.passwordHash, currentPassword);
      if (!isValid) {
        res.status(401).json({ error: "Current password is incorrect." });
        return;
      }
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all other sessions for security on password change
    await prisma.session.deleteMany({
      where: { userId, id: { not: req.user?.sid } }
    });

    AuditService.log({
      userId,
      action: user.passwordHash ? "PASSWORD_CHANGED" : "PASSWORD_SET",
      status: "SUCCESS",
      ipAddress: req.ip || "unknown",
    });

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
};

export const verifyPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.sub;
    const { password } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!password) {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      res.status(400).json({ error: "No password set for this account." });
      return;
    }

    const isValid = await verifyPasswordCrypto(user.passwordHash, password);
    if (!isValid) {
      res.status(401).json({ error: "Incorrect password." });
      return;
    }

    res.json({ success: true });
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

    const parsedSessions = sessions.map((session: any) => {
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
    const userId = req.user?.sub;
    const currentSid = req.user?.sid;
    const targetSid = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: targetSid }
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await prisma.session.delete({
      where: { id: targetSid }
    });

    AuditService.log({
      userId,
      action: "SESSION_REVOKED",
      status: "SUCCESS",
      details: { sessionId: targetSid, isCurrent: targetSid === currentSid }
    });

    if (targetSid === currentSid) {
      res.status(205).json({ message: "Current session revoked. Please re-authenticate." });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const revokeOtherSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.sub;
    const currentSid = req.user?.sid;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!currentSid) {
      res.status(400).json({ 
        error: "legacy_session", 
        message: "Your current session is using an older security format. Please log out and back in once to enable this feature." 
      });
      return;
    }

    const result = await prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSid }
      }
    });

    AuditService.log({
      userId,
      action: "OTHER_SESSIONS_REVOKED",
      status: "SUCCESS",
      details: { count: result.count }
    });

    res.status(200).json({ message: `Successfully revoked ${result.count} other sessions.` });
  } catch (error) {
    next(error);
  }
};

export const unlinkProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.sub;
    const providerId = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { authProviders: true }
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const providerToUnlink = user.authProviders.find(p => p.id === providerId);
    if (!providerToUnlink) {
      res.status(404).json({ error: "Provider link not found" });
      return;
    }

    // --- SAFETY VALVE CHECK ---
    const hasPassword = !!user.passwordHash;
    const otherProvidersCount = user.authProviders.length - 1;

    if (!hasPassword && otherProvidersCount === 0) {
      res.status(400).json({ 
        error: "safety_valve_triggered",
        message: "You cannot unlink your last authentication method. Please set a password or link another account first." 
      });
      return;
    }

    await prisma.authProvider.delete({
      where: { id: providerId as string }
    });

    // Invalidate profile cache
    await redis.del(`hub:user:${userId}:profile`);

    AuditService.log({
      userId,
      action: "PROVIDER_UNLINKED",
      status: "SUCCESS",
      details: { provider: providerToUnlink.provider }
    });

    res.status(200).json({ message: "Provider unlinked successfully." });
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
      take: 50,
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
