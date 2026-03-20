import { Router } from "express";
import { createClient, listClients, deleteClient, updateClient, rotateSecret, getStats } from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

// Apply global protection to the entire developer API
router.use(authenticate);

// --- User-owned Client Management ---
router.get("/clients", listClients);
router.post("/clients", createClient);
router.patch("/clients/:id", updateClient);
router.delete("/clients/:id", deleteClient);
router.post("/clients/:id/rotate", rotateSecret);
router.get("/stats", getStats);

export default router;
