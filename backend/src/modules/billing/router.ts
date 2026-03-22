import { Router } from "express";
import express from "express";
import { stripeWebhook } from "./webhook.js";
import { getBillingStatus, createCheckoutSession, createPortalSession } from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

// Stripe webhook must use raw body
router.post("/stripe", express.raw({ type: "application/json" }), stripeWebhook);

// Authenticated Billing Endpoints
router.use(authenticate);

router.get("/status", getBillingStatus);
router.post("/checkout-session", createCheckoutSession);
router.post("/customer-portal", createPortalSession);

export default router;
