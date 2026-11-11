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

app.disable("x-powered-by");
app.set("trust proxy", 1);

const requiredSecrets = ["MONGODB_URI", "ANALYTICS_ADMIN_TOKEN", "VISITOR_HASH_SECRET"];
for (const key of requiredSecrets) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
if (process.env.ANALYTICS_ADMIN_TOKEN.length < 32 || process.env.VISITOR_HASH_SECRET.length < 32) {
  console.error("ANALYTICS_ADMIN_TOKEN and VISITOR_HASH_SECRET must each be at least 32 characters.");
  process.exit(1);
}

const mainCsp = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'"],
  frameSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'", "mailto:"],
  frameAncestors: ["'self'"],
  upgradeInsecureRequests: []
};

app.use((req, res, next) => {
  if (isProduction && req.secure !== true) {
    return res.redirect(308, `https://${req.get("host")}${req.originalUrl}`);
  }
  next();
});

app.use((req, res, next) => {
  const isRobotDocument = req.path === "/depth-robot.html";
  helmet({
    contentSecurityPolicy: {
      directives: isRobotDocument
        ? {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'self'"]
          }
        : mainCsp,
      useDefaults: true
    },
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  })(req, res, next);
});

app.use(express.json({ limit: "10kb", type: "application/json" }));

const visitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many visit events. Please try again later." }
});
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

const mongoClient = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10
});
let visitsCollection;

function cleanText(value, maxLength = 300) {
  if (typeof value !== "string") return "";
  return value.replace(/[\\u0000-\\u001F\\u007F]/g, "").trim().slice(0, maxLength);
}

function getBrowser(userAgent) {
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return "Safari";
  return "Other";
}

function getDevice(userAgent) {
  if (/tablet|ipad/i.test(userAgent)) return "Tablet";
  if (/mobile|android|iphone/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

function getOperatingSystem(userAgent) {
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Mac OS X|Macintosh/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Other";
}

function getVisitorId(req, userAgent) {
  const address = req.ip || req.socket.remoteAddress || "unknown";
  return crypto
    .createHmac("sha256", process.env.VISITOR_HASH_SECRET)
    .update(`${address}| ${userAgent}`)
    .digest("hex")
    .slice(0, 24);
}

function requireAdmin(req, res, next) {
  const provided = req.get("authorization") || "";
  const expected = `Bearer ${process.env.ANALYTICS_ADMIN_TOKEN}`;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  const valid = providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  if (!valid) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/analytics/visit", visitLimiter, async (req, res) => {
  try {
    const userAgent = cleanText(req.get("user-agent") || "", 500);
    const rawReferrer = cleanText(req.body?.referrer || "", 500);
    let referrer = "";
    try {
      const parsed = new URL(rawReferrer);
      if (["http:", "https:"].includes(parsed.protocol)) referrer = parsed.origin;
    } catch {
      // Ignore invalid or non-URL referrers.
    }

    const visit = {
      visitorId: getVisitorId(req, userAgent),
      visitedAt: new Date(),
      page: cleanText(req.body?.page || "/", 120) || "/",
      referrer,
      browser: getBrowser(userAgent),
      device: getDevice(userAgent),
      operatingSystem: getOperatingSystem(userAgent),
      userAgent
    };

    await visitsCollection.insertOne(visit);
    res.status(202).json({ recorded: true });
  } catch (error) {
    console.error("Unable to record portfolio visit:", error.message);
    res.status(503).json({ error: "Analytics is temporarily unavailable." });
  }
});

app.get("/api/analytics/summary", adminLimiter, requireAdmin, async (_req, res) => {
  try {
    const [total, recent] = await Promise.all([
      visitsCollection.countDocuments(),
      visitsCollection.find({}, {
        projection: { _id: 0, visitorId: 1, visitedAt: 1, page: 1, referrer: 1, browser: 1, device: 1, operatingSystem: 1 }
      }).sort({ visitedAt: -1 }).limit(100).toArray()
    ]);
    res.set("Cache-Control", "no-store");
    res.json({ total, recent });
  } catch (error) {
    console.error("Unable to load analytics:", error.message);
    res.status(503).json({ error: "Analytics is temporarily unavailable." });
  }
});

app.use(express.static(distDir, {
  index: "index.html",
  maxAge: isProduction ? "1h" : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith("index.html") || filePath.endsWith("analytics.html")) {
      res.setHeader("Cache-Control", "no-store");
    }
  }
}));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(distDir, "index.html"), error => error && next(error));
});

app.use((error, _req, res, _next) => {
  console.error("Server error:", error.message);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await mongoClient.connect();
  const database = mongoClient.db(process.env.MONGODB_DB || "portfolio");
  visitsCollection = database.collection("track");
  await visitsCollection.createIndex({ visitedAt: -1 });
  await visitsCollection.createIndex({ visitorId: 1, visitedAt: -1 });
  await visitsCollection.createIndex({ visitedAt: 1 }, { expireAfterSeconds: 15552000 });
  app.listen(port, "0.0.0.0", () => {
    console.log(`Portfolio server listening on port ${port}`);
  });
}

start().catch(error => {
  console.error("Failed to start portfolio server:", error.message);
  process.exit(1);
});

async function shutdown() {
  await mongoClient.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
