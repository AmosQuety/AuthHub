import { Router } from "express";
import { createClient, listClients, deleteClient, listUsers, deleteUser, impersonateUser, createTenant, listTenants, getTenant, updateTenant, deleteTenant, globalSearch } from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/requireRole.js";
import observabilityRouter from "../observability/router.js";

const router = Router();

// Apply global RBAC protection to the entire admin API
router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get("/search", globalSearch);

// --- Client Management ---
router.get("/clients", listClients);
router.post("/clients", createClient);
router.delete("/clients/:id", deleteClient);

// --- User Management ---
router.get("/users", listUsers);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/impersonate", impersonateUser);

// --- Tenant Management ---
router.get("/tenants", listTenants);
router.post("/tenants", createTenant);
router.get("/tenants/:id", getTenant);
router.patch("/tenants/:id", updateTenant);
router.delete("/tenants/:id", deleteTenant);

// --- Observability (Analytics) ---
router.use("/observability", observabilityRouter);

// --- System Settings ---
import { getSystemSettings, updateSystemSettings, listRootApiKeys, createRootApiKey, revokeRootApiKey } from "./controller.js";
router.get("/settings", getSystemSettings);
router.patch("/settings", updateSystemSettings);

// --- Root API Keys ---
router.get("/root-keys", listRootApiKeys);
router.post("/root-keys", createRootApiKey);
router.delete("/root-keys/:id", revokeRootApiKey);

export default router;
