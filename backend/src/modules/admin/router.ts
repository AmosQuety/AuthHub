import { Router } from "express";
import { createClient, listClients, deleteClient } from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router();

// Apply global RBAC protection to the entire admin API
router.use(authenticate);
router.use(requireRole("ADMIN"));

// --- Client Management ---
router.get("/clients", listClients);
router.post("/clients", createClient);
router.delete("/clients/:id", deleteClient);

export default router;
