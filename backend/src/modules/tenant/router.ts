import { Router } from "express";
import { getTenantConfig, updateTenantConfig } from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router();

// Public endpoint so frontends can skin their login pages before the user logs in
// Public endpoint so frontends can skin their login pages before the user logs in
router.get("/:tenantId/config", getTenantConfig);

// Admin-only endpoint to update tenant branding/security settings
router.put("/:tenantId/config", authenticate, requireRole("ADMIN"), updateTenantConfig);

export default router;
