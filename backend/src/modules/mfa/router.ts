import { Router } from "express";
import { enrollTotp, verifyTotp, challengeTotp } from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

// MFA configuration is protected by standard access tokens
router.post("/totp/enroll", authenticate, enrollTotp);
router.post("/totp/verify", authenticate, verifyTotp);

// The challenge endpoint is used *during* login, so it is public (but requires the mfa_token)
router.post("/totp/challenge", challengeTotp);

export default router;
