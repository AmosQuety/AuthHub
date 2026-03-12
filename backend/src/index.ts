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

// Strict Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameAncestors: ["'none'"], // Prevent clickjacking
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Prevent MIME type sniffing
    noSniff: true,
    // Add X-XSS-Protection
    xssFilter: true,
  })
);
// CORS — only allow explicitly whitelisted origins from env
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3001")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin) or whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);
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
  app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
