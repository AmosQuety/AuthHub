import { Router } from "express";
import { getTenantConfig } from "./controller.js";

const router = Router();

// Public endpoint so frontends can skin their login pages before the user logs in
router.get("/:tenantId/config", getTenantConfig);

export default router;
