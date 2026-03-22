import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/router.js";
import oidcRouter from "./modules/oidc/router.js";
import oauthRouter from "./modules/oauth/router.js";
import adminRouter from "./modules/admin/router.js";
import developerRouter from "./modules/developer/router.js";
import billingRouter from "./modules/billing/router.js";
import prisma from "./db/client.js";
import cron from "node-cron";
import { runKeepAlive } from "./db/keep-alive.js";
import { openApiSpec } from "./docs/openapi.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable 'trust proxy' to ensure req.ip reads the true client IP behind Cloudflare/Render/AWS load balancers
app.set("trust proxy", 1);

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

// Webhooks must be mounted before expressive.json() so Stripe can read the raw buffer
app.use("/api/v1/webhooks", billingRouter);

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
app.use("/api/v1/oidc", oidcRouter);
app.use("/api/v1/oauth", oauthRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/developer", developerRouter);

// ─── API Docs ─────────────────────────────────────────────────────────────────
// Serve the OpenAPI spec as JSON (can be consumed by any Swagger viewer)
app.get("/api/v1/docs/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

// Serve a Swagger UI HTML page (pulls CSS/JS from the official CDN)
app.get("/api/v1/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>AuthHub API Docs</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      <style>body{margin:0;padding:0;background:#0f172a;}</style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        SwaggerUIBundle({
          url: '/api/v1/docs/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
          layout: 'BaseLayout'
        });
      </script>
    </body>
    </html>
  `);
});


// Global Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    
    // Database & Redis Keep-Alive (every 6 hours)
    cron.schedule("0 */6 * * *", () => {
       runKeepAlive();
    });

    // Run first ping immediately on start
    runKeepAlive();
  });

  // Graceful Shutdown routines for containerized deployments (Docker/Kubernetes)
  const gracefulShutdown = () => {
    console.log("Received kill signal, shutting down gracefully.");
    server.close(async () => {
      console.log("Closed out remaining HTTP connections.");
      try {
        await prisma.$disconnect();
        console.log("Prisma connection closed.");
        process.exit(0);
      } catch (err) {
        console.error("Error during graceful shutdown", err);
        process.exit(1);
      }
    });

    // Force close after 10 seconds if connections are hanging
    setTimeout(() => {
      console.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}

export default app;
