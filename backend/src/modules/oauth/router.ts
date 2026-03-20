import { Router } from "express";
import { authorize, token, checkConsent } from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { tokenLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

// Authorization endpoint - protected, user must be logged in to grant access
// The React frontend submits consent via POST request
router.post("/authorize", authenticate, authorize);

// Token endpoint - public (machine-to-machine / back-channel), rate limited
router.post("/token", tokenLimiter, token);

// Check if a user has already granted the requested scopes to an app
router.get("/consent-check", authenticate, checkConsent);

export default router;
