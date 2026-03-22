import { Router } from "express";
import { authorize, token, checkConsent, authorizeRedirect } from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { tokenLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

// Authorization endpoint - GET redirects to frontend authorize page, POST is for consent submission
router.get("/authorize", authorizeRedirect);
router.post("/authorize", authenticate, authorize);

// Token endpoint - public (machine-to-machine / back-channel), rate limited
router.post("/token", tokenLimiter, token);

// Check if a user has already granted the requested scopes to an app
router.get("/consent-check", authenticate, checkConsent);

export default router;
