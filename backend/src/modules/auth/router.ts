import { Router } from "express";
import { register, login, logout, me, refresh, revokeToken, introspectToken, sendVerificationEmail, verifyEmail, forgotPassword, resetPassword } from "./controller.js";
import { googleLogin, googleCallback, githubLogin, githubCallback } from "./social.js";
import mfaRouter from "../mfa/router.js";
import passkeyRouter from "../passkey/router.js";
import adminRouter from "../admin/router.js";
import tenantRouter from "../tenant/router.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { authLimiter, refreshLimiter } from "../../middlewares/rateLimiter.js";
import { registerSchema, loginSchema } from "./schema.js";

const router = Router();

// Rate limited & Input Validated
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Token rotation
router.post("/refresh", refreshLimiter, refresh);

// --- OAuth 2.0 Token Management ---
router.post("/revoke", revokeToken);
router.post("/introspect", introspectToken);

// --- SOCIAL LOGIN ---
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);

router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);

// --- MFA ---
router.use("/mfa", mfaRouter);

// --- PASSKEYS ---
router.use("/passkey", passkeyRouter);

// --- TENANTS & MULTI-BRANDING ---
router.use("/tenant", tenantRouter);

// --- ADMIN API (RBAC Guarded) ---
router.use("/admin", adminRouter);

router.post("/logout", logout);

// Protected
router.get("/me", authenticate, me);

// --- EMAIL VERIFICATION ---
// Send link (authenticated — user must be logged in to request their own verification)
router.post("/verify-email/send", authenticate, authLimiter, sendVerificationEmail);
// Consume link (public — user clicks from their email)
router.get("/verify-email/:token", verifyEmail);

// --- PASSWORD RESET ---
// Request reset link (public, rate-limited to prevent email spam)
router.post("/forgot-password", authLimiter, forgotPassword);
// Submit new password using token (public, rate-limited)
router.post("/reset-password", authLimiter, resetPassword);

export default router;
