import { Router } from "express";
import {
    getRegistrationOptions,
    verifyRegistration,
    getAuthOptions,
    verifyAuth,
} from "./controller.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

// --- Registration ---
// You must be logged in with a password or OAuth first to associate a new hardware passkey to your account
router.post("/register/options", authenticate, getRegistrationOptions);
router.post("/register/verify", authenticate, verifyRegistration);

// --- Authentication (Login without Password) ---
// Public route replacing traditional /login
router.post("/auth/options", getAuthOptions);
router.post("/auth/verify", verifyAuth);

export default router;
