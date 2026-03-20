import { Router } from "express";
import { stripeWebhook } from "./webhook.js";
import express from "express";

const router = Router();

// Stripe requires raw body to verify signatures cryptographically
router.post("/stripe", express.raw({ type: "application/json" }), stripeWebhook);

export default router;
