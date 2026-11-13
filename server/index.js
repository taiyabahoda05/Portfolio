
import "dotenv/config";

import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { MongoClient } from "mongodb";

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3001);

// --------------------------------------------------
// ENVIRONMENT VALIDATION
// --------------------------------------------------

for (const key of [
  "MONGODB_URI",
  "ANALYTICS_ADMIN_TOKEN",
  "VISITOR_HASH_SECRET"
]) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

if (
  process.env.ANALYTICS_ADMIN_TOKEN.length < 32 ||
  process.env.VISITOR_HASH_SECRET.length < 32
) {
  throw new Error(
    "ANALYTICS_ADMIN_TOKEN and VISITOR_HASH_SECRET must each be at least 32 characters."
  );
}

// --------------------------------------------------
// EXPRESS CONFIGURATION
// --------------------------------------------------

app.disable("x-powered-by");
app.set("trust proxy", 1);

// --------------------------------------------------
// CORS
// --------------------------------------------------

app.use((req, res, next) => {
  const origin = req.get("Origin");
  const allowedOrigin = process.env.FRONTEND_ORIGIN;

  if (allowedOrigin && origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS"
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(
      !allowedOrigin || origin === allowedOrigin ? 204 : 403
    );
  }

  next();
});

// --------------------------------------------------
// HTTPS REDIRECTION
// --------------------------------------------------

app.use((req, res, next) => {
  if (isProduction && !req.secure) {
    return res.redirect(
      308,
      `https://${req.get("host")}${req.originalUrl}`
    );
  }

  next();
});

// --------------------------------------------------
// SECURITY HEADERS
// --------------------------------------------------

const mainCsp = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: [
    "'self'",
    "https://fonts.googleapis.com"
  ],
  fontSrc: [
    "'self'",
    "https://fonts.gstatic.com"
  ],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "https://taiyaba-portfolio-analytics.onrender.com"],
  frameSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'", "mailto:"],
  frameAncestors: ["'self'"],
  upgradeInsecureRequests: isProduction ? [] : null
};

app.use((req, res, next) => {
  const isRobotDocument = req.path === "/depth-robot.html";

  helmet({
    contentSecurityPolicy: {
      directives: isRobotDocument
        ? {
            defaultSrc: ["'self'"],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://cdnjs.cloudflare.com"
            ],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: [
              "'self'",
              "https://cdnjs.cloudflare.com"
            ],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'self'"]
          }
        : mainCsp,
      useDefaults: true
    },

    crossOriginEmbedderPolicy: false,

    hsts: isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      : false,

    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    }
  })(req, res, next);
});

// --------------------------------------------------
// REQUEST PARSING
// --------------------------------------------------

app.use(
  express.json({
    limit: "10kb",
    type: "application/json"
  })
);

// --------------------------------------------------
// RATE LIMITING
// --------------------------------------------------

const visitLimiter = rateLimit({
  windowMs: 60_000,
  limit: 25,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many visit events. Please try again later."
  }
});

const adminLimiter = rateLimit({
  windowMs: 60_000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

// --------------------------------------------------
// MONGODB CONNECTION
// --------------------------------------------------

const mongoClient = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10
});

let visitsCollection;
let server;

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

function cleanText(value, maxLength = 250) {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

// --------------------------------------------------
// BROWSER, DEVICE AND OS DETECTION
// --------------------------------------------------

function classify(userAgent = "") {
  const browser =
    /Edg\//i.test(userAgent)
      ? "Edge"
      : /Firefox\//i.test(userAgent)
        ? "Firefox"
        : /(?:OPR|Opera)\//i.test(userAgent)
          ? "Opera"
          : /(?:Chrome|CriOS)\//i.test(userAgent)
            ? "Chrome"
            : /(?:Safari|Version)\//i.test(userAgent)
              ? "Safari"
              : "Other";

  const device =
    /ipad|tablet|playbook|silk/i.test(userAgent)
      ? "Tablet"
      : /android/i.test(userAgent) &&
        !/mobile/i.test(userAgent)
        ? "Tablet"
        : /mobile|android|iphone|ipod|windows phone|blackberry/i.test(userAgent)
          ? "Mobile"
          : "Desktop";

  const os =
    /Windows/i.test(userAgent)
      ? "Windows"
      : /Android/i.test(userAgent)
        ? "Android"
        : /iPhone|iPad|iPod/i.test(userAgent)
          ? "iOS"
          : /Mac OS X|Macintosh/i.test(userAgent)
            ? "macOS"
            : /Linux/i.test(userAgent)
              ? "Linux"
              : "Other";

  return { browser, device, os };
}

// --------------------------------------------------
// VISITOR HASHING
// --------------------------------------------------

function getVisitorId(req, userAgent) {
  const address =
    req.ip ||
    req.socket.remoteAddress ||
    "unknown";

  return crypto
    .createHmac("sha256", process.env.VISITOR_HASH_SECRET)
    .update(`${address}|${userAgent}`)
    .digest("hex")
    .slice(0, 24);
}

// --------------------------------------------------
// ADMIN AUTHENTICATION
// --------------------------------------------------

function requireAdmin(req, res, next) {
  const provided =
    req.get("authorization") || "";

  const expected =
    `Bearer ${process.env.ANALYTICS_ADMIN_TOKEN}`;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  const valid =
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(
      providedBuffer,
      expectedBuffer
    );

  if (!valid) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  next();
}

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok"
  });
});

// --------------------------------------------------
// VISITOR TRACKING API
// --------------------------------------------------

app.post(
  "/api/analytics/visit",
  visitLimiter,
  async (req, res) => {
    try {
      const rawUserAgent =
        req.get("user-agent") || "";

      const userAgent = cleanText(rawUserAgent, 500);

      const {
        browser,
        device,
        os
      } = classify(userAgent);

      let referrer = "";

      try {
        const url = new URL(
          cleanText(req.body?.referrer, 500)
        );

        if (["http:", "https:"].includes(url.protocol)) {
          referrer = url.origin;
        }
      } catch {
        // Ignore invalid referrers.
      }

      const visit = {
        visitorId: getVisitorId(req, userAgent),
        visitedAt: new Date(),
        page: cleanText(req.body?.page || "/", 120) || "/",
        referrer,
        browser,
        device,
        operatingSystem: os
      };

      await visitsCollection.insertOne(visit);

      res.status(202).json({
        recorded: true
      });

    } catch (error) {
      console.error(
        "Visit tracking failed:",
        error.message
      );

      res.status(503).json({
        error: "Analytics temporarily unavailable"
      });
    }
  }
);

// --------------------------------------------------
// ANALYTICS SUMMARY API
// --------------------------------------------------

app.get(
  "/api/analytics/summary",
  adminLimiter,
  requireAdmin,
  async (_req, res) => {
    try {
      const since = new Date(
        Date.now() - 30 * 86400000
      );

      const [
        total,
        unique,
        last30,
        recent,
        devices,
        browsers,
        pages
      ] = await Promise.all([

        // Total page visits
        visitsCollection.countDocuments(),

        // Unique visitors
        visitsCollection.aggregate([
          {
            $group: {
              _id: "$visitorId"
            }
          },
          {
            $count: "total"
          }
        ]).toArray(),

        // Visits in the last 30 days
        visitsCollection.countDocuments({
          visitedAt: {
            $gte: since
          }
        }),

        // Latest 100 visits
        visitsCollection.find(
          {},
          {
            projection: {
              _id: 0,
              visitorId: 1,
              visitedAt: 1,
              page: 1,
              referrer: 1,
              browser: 1,
              device: 1,
              operatingSystem: 1
            }
          }
        )
          .sort({ visitedAt: -1 })
          .limit(100)
          .toArray(),

        // Device statistics
        visitsCollection.aggregate([
          {
            $group: {
              _id: "$device",
              count: {
                $sum: 1
              }
            }
          },
          {
            $sort: {
              count: -1
            }
          }
        ]).toArray(),

        // Browser statistics
        visitsCollection.aggregate([
          {
            $group: {
              _id: "$browser",
              count: {
                $sum: 1
              }
            }
          },
          {
            $sort: {
              count: -1
            }
          }
        ]).toArray(),

        // Most visited pages
        visitsCollection.aggregate([
          {
            $group: {
              _id: "$page",
              count: {
                $sum: 1
              }
            }
          },
          {
            $sort: {
              count: -1
            }
          },
          {
            $limit: 8
          }
        ]).toArray()

      ]);

      res.set("Cache-Control", "no-store");

      res.json({
        total,
        uniqueVisitors: unique[0]?.total || 0,
        last30,
        recent,
        devices,
        browsers,
        pages
      });

    } catch (error) {
      console.error(
        "Analytics summary failed:",
        error.message
      );

      res.status(503).json({
        error: "Analytics temporarily unavailable"
      });
    }
  }
);

// --------------------------------------------------
// SERVE REACT + VITE FRONTEND
// --------------------------------------------------

app.use(
  express.static(distDir, {
    index: "index.html",

    maxAge: isProduction ? "1h" : 0,

    setHeaders(res, filePath) {
      if (
        filePath.endsWith("index.html") ||
        filePath.endsWith("analytics.html")
      ) {
        res.setHeader("Cache-Control", "no-store");
      }
    }
  })
);

// --------------------------------------------------
// FRONTEND ROUTING FALLBACK
// --------------------------------------------------

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      error: "Not found"
    });
  }

  res.sendFile(
    path.join(distDir, "index.html"),
    (error) => {
      if (error) next(error);
    }
  );
});

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use((error, _req, res, _next) => {
  console.error("Server error:", error.message);

  res.status(500).json({
    error: "Internal server error"
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

async function start() {
  await mongoClient.connect();

  console.log("MongoDB connected successfully.");

  const database = mongoClient.db(
    process.env.MONGODB_DB || "portfolio"
  );

  // Preserve your existing collection.
  visitsCollection = database.collection("track");

  // Database indexes
  await visitsCollection.createIndex({
    visitedAt: -1
  });

  await visitsCollection.createIndex({
    visitorId: 1,
    visitedAt: -1
  });

  // Automatically expire records after 180 days.
  await visitsCollection.createIndex(
    { visitedAt: 1 },
    { expireAfterSeconds: 15552000 }
  );

  server = app.listen(port, "0.0.0.0", () => {
    console.log(
      `Portfolio server listening on port ${port}`
    );
  });
}

// --------------------------------------------------
// GRACEFUL SHUTDOWN
// --------------------------------------------------

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;

  shuttingDown = true;

  console.log(`${signal} received. Shutting down...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await mongoClient.close();

    console.log("Server shutdown completed.");

    process.exit(0);

  } catch (error) {
    console.error(
      "Shutdown failed:",
      error.message
    );

    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// --------------------------------------------------
// INITIALIZE APPLICATION
// --------------------------------------------------

start().catch(async (error) => {
  console.error("Startup failed:", error.message);

  await mongoClient.close().catch(() => {});

  process.exit(1);
});
