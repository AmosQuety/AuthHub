import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser"; // Need to install this
import authRouter from "./modules/auth/router.js";
import oidcRouter from "./modules/oidc/router.js";
import oauthRouter from "./modules/oauth/router.js";
import prisma from "./db/client.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(cookieParser());

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // OAuth clients often send form-urlencoded

// Routes
app.get("/health", async (req, res) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected", timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected", error: String(error) });
  }
});

app.use("/api/v1/auth", authRouter);
app.use("/auth", oidcRouter);
app.use("/api/v1/oauth", oauthRouter);

// Global Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
