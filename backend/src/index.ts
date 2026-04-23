import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";
import compression from "compression";
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
import redis from "./db/redis.js";
import logger from "./core/logger.js";

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
        scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://unpkg.com"],
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
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:8081")
// localhost:3001
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

// High Performance I/O — Compress all responses
app.use(cookieParser());

app.use(
  compression({
    filter: (req, res) => {
      // Never compress the webhook route — Stripe needs the raw body
      if (req.path.startsWith("/api/v1/webhooks")) return false;
      return compression.filter(req, res);
    },
  })
);

// Webhooks must be mounted before expressive.json() so Stripe can read the raw buffer
app.use("/api/v1/webhooks", billingRouter);

// Body Parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" })); // OAuth clients often send form-urlencoded

// Security: Prevent sensitive API responses from being cached
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Routes
app.get("/health", async (_req, res) => {
  try {
    await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      redis.ping(),
    ]);
    res.json({
      status: "ok",
      database: "connected",
      cache: "connected",
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "unknown",
      cache: "unknown",
      error: String(error)
    });
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>API Docs | AuthHub</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      <style>
        body { margin: 0; padding: 0; background: #0b0f1a; font-family: sans-serif; overflow-x: hidden; }
        
        /* Dark Mode Overrides for Swagger UI */
        .swagger-ui { filter: invert(88%) hue-rotate(180deg); max-width: 1200px; margin: 0 auto; padding: 20px; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #000; font-size: 32px; }
        .swagger-ui .scheme-container { background: transparent; box-shadow: none; border-bottom: 1px solid rgba(0,0,0,0.1); padding: 20px 0; }
        .swagger-ui .opblock { border-radius: 12px; border: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 12px; }
        .swagger-ui .btn.authorize { color: #1bd671; border-color: #1bd671; background: transparent; }
        .swagger-ui .btn.authorize svg { fill: #1bd671; }
        
        /* Specific fix for the white bar the user saw */
        .swagger-ui .servers-title { color: #000; }
        .swagger-ui select { background: #eee; border: 1px solid #ccc; border-radius: 8px; padding: 4px 8px; }

        /* Outer container to un-invert the background but keep the content readable */
        #ui-wrapper { background: #0b0f1a; min-height: 100vh; }
      </style>
    </head>
    <body>
      <div id="ui-wrapper">
        <div id="swagger-ui"></div>
      </div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/api/v1/docs/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            layout: 'BaseLayout',
            defaultModelsExpandDepth: -1, // Hide schemas by default for cleaner look
          });
        };
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
    logger.info({ port: PORT, host: "0.0.0.0" }, "server_started");
    
    // Database & Redis Keep-Alive (every 6 hours)
    cron.schedule("0 */6 * * *", () => {
       runKeepAlive();
    });

    // Run first ping immediately on start
    runKeepAlive();
  });

  // Graceful Shutdown routines for containerized deployments (Docker/Kubernetes)
  const gracefulShutdown = () => {
    logger.info("received_kill_signal_shutting_down_gracefully");
    server.close(async () => {
      logger.info("closed_out_remaining_http_connections");
      try {
        await prisma.$disconnect();
        logger.info("prisma_connection_closed");
        process.exit(0);
      } catch (err) {
        logger.error({ err }, "error_during_graceful_shutdown");
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
