import { Router } from "express";
import { getJwks, getOpenIdConfiguration, userinfo } from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

// Return public JWKS securely
router.get("/.well-known/jwks.json", getJwks);

// Return standard OIDC endpoints
router.get("/.well-known/openid-configuration", getOpenIdConfiguration);

// UserInfo Endpoint
router.get("/userinfo", authenticate, userinfo);

export default router;
