import { Router } from "express";
import { 
    createWebhookEndpoint, 
    listWebhookEndpoints, 
    deleteWebhookEndpoint,
    getWebhookDeliveries 
} from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

// All webhook routes require authentication
router.use(authenticate);

router.post("/", createWebhookEndpoint);
router.get("/", listWebhookEndpoints);
router.delete("/:id", deleteWebhookEndpoint);
router.get("/:id/deliveries", getWebhookDeliveries);

export default router;
