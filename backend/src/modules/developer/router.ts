import { Router } from "express";
import { createClient, listClients, deleteClient } from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

// Apply global protection to the entire developer API
router.use(authenticate);

// --- User-owned Client Management ---
router.get("/clients", listClients);
router.post("/clients", createClient);
router.delete("/clients/:id", deleteClient);

export default router;
