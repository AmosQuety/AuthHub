import { Router } from "express";
import { getJwks, getOpenIdConfiguration } from "./controller.js";

const router = Router();

router.get("/.well-known/jwks.json", getJwks);
router.get("/.well-known/openid-configuration", getOpenIdConfiguration);

export default router;
