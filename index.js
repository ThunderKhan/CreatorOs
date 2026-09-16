const dotenv = require("dotenv");
dotenv.config();
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local", override: true });
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev_secret_key_creatoros_2026";
}
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const passport = require("passport");
const path = require("path");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { generalLimiter } = require("./middleware/rateLimiters");
const cacheHeadersMiddleware = require("./middleware/cacheHeaders");
const {
  getProfileFromCache,
  setProfileInCache,
  invalidateProfileCache,
} = require("./utils/profileCache");

// Validate required environment variables
const requiredEnvVars = [
  { name: "MONGODB_URI", description: "MongoDB connection string" },
  { name: "JWT_SECRET", description: "Secret key for JWT token signing" },
  {
    name: "INSTAGRAM_WEBHOOK_VERIFY_TOKEN",
    description: "Instagram webhook verification token",
  },
  {
    name: "INSTAGRAM_APP_SECRET",
    description: "Instagram app secret for webhook signature verification",
  },
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v.name]);

if (missingVars.length > 0) {
  console.warn("\n⚠️ Missing environment variables for full production mode:");
  missingVars.forEach((v) => {
    console.warn(`   - ${v.name} (${v.description})`);
  });
  console.warn("\n📋 The app will start in local mock mode.");
  console.warn(
    "   To use a real database, copy .env.example to .env.local and fill in the values.\n",
  );
}

const app = express();
const { BRAND } = require("./utils/brand");
const connectDB = require("./connect");

// Vercel Serverless specific: ensure DB connects on every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// --- Route Imports ---
const urlRoutes = require("./routes/url");
const analyticsRoutes = require("./routes/analytics");
const collaborationRoutes = require("./routes/collaboration");
const aiRoute = require("./routes/ai");
const authRoutes = require("./routes/auth");
const instagramRoutes = require("./routes/instagram");
const billingRoute = require("./routes/billing");
const { handleWebhook: handleBillingWebhook } = require("./controller/billing");
const {
  verifyWebhook,
  verifyWebhookSignature,
  handleWebhook: handleInstagramWebhook,
} = require("./controller/instagramWebhookController");
const domainRoute = require("./routes/domain");
const sponsorRoute = require("./routes/sponsor");
const settingsRoutes = require("./routes/settings");
const contentRoutes = require("./routes/content");
const suggestionRoutes = require("./routes/suggestionRoutes");
const bioRoutes = require("./routes/bioRoutes");
const { renderPublicBioProfile } = require("./controller/bioController");
const qrCodeRoutes = require("./routes/qrCode");
const smartNotificationRoutes = require("./routes/smartNotificationRoutes");
const contentOsRoutes = require("./routes/contentOsRoutes");
const creatorCrmRoutes = require("./routes/creatorCrmRoutes");
const taskRoutes = require("./routes/taskRoutes");
const aiAssistantRoutes = require("./routes/aiAssistantRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const healthRoutes = require("./routes/health");
const { generateCsrf, verifyCsrf } = require("./middleware/csrf");

// Generate a per-request nonce before Helmet so early exits (CSRF/validation)
// still receive CSP headers that reference res.locals.nonce.
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          (req, res) => `'nonce-${res.locals.nonce}'`,
          "https://cdn.jsdelivr.net",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(cors());
app.use(cacheHeadersMiddleware);
app.use(cookieParser());
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  handleBillingWebhook,
);
app.use(express.urlencoded({ extended: true }));
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
// Fix for Vercel Serverless: req.query is a getter, so direct assignment throws TypeError.
app.use((req, res, next) => {
  ["body", "params", "headers", "query"].forEach((key) => {
    if (req[key]) {
      const sanitized = mongoSanitize.sanitize(req[key], { replaceWith: "_" });
      try {
        req[key] = sanitized;
      } catch (e) {
        // If assignment fails (e.g., getter-only on Vercel), use Object.defineProperty
        Object.defineProperty(req, key, {
          value: sanitized,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }
  });
  next();
});
// Observability endpoints (/health, /metrics) must be mounted before CSRF middleware
app.use("/", healthRoutes);

// Instagram webhook must be mounted before the global CSRF middleware so Meta
// callbacks (which carry no _csrf cookie) are verified by HMAC signature only.
app.get("/api/instagram/webhook", verifyWebhook);
app.post(
  "/api/instagram/webhook",
  verifyWebhookSignature,
  handleInstagramWebhook,
);
app.use(generateCsrf);
app.use(verifyCsrf);
app.use(passport.initialize());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "view"));
app.locals.BRAND = BRAND;

const urlShortenerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: "Too many URLs generated, please try again later.",
});

app.use("/", authRoutes);

const {
  protect,
  preventContributorWrites,
  redirectIfAuthenticated,
} = require("./middleware/auth");

app.use(express.static(path.join(__dirname, "public")));
const shortid = require("shortid");
const services = require("./services.config");
const User = require("./model/user");
const Creator = require("./model/creator");
const Invite = require("./model/invite");
const BioProfile = require("./model/bioProfile");
const Url = require("./model/url");
const UploadFile = require("./model/upload");
const port = process.env.PORT || 3000;
const asyncHandler = require("./utils/asyncHandler");

const {
  acceptInvite,
  acceptInviteFromDashboard,
} = require("./controller/collaborationController");
const { getDashboardData } = require("./utils/dashboardHelper");
const { renderCalendarPage } = require("./controller/contentOsController");

app.use("/suggestions", protect, suggestionRoutes);
app.use("/services/creator-crm", protect, collaborationRoutes);
app.use("/services/qr-code-generator", qrCodeRoutes);
app.use("/services/content-os", protect, contentOsRoutes);
app.use("/services/ai-assistant", aiAssistantRoutes);
app.get("/services/content-calendar", protect, renderCalendarPage);
app.get("/services/sponsorship-matchmaker", protect, (req, res) => {
  res.render("sponsorship-matchmaker");
});
app.use("/", smartNotificationRoutes);
app.use("/", taskRoutes);
app.use("/", meetingRoutes);
app.post(
  "/dashboard/accept-invite",
  protect,
  preventContributorWrites,
  acceptInviteFromDashboard,
);
app.get("/invites/accept/:token", acceptInvite);

// Billing & Domain Routes

// API Routes
app.use("/api", generalLimiter);
app.use("/api/billing", billingRoute);
app.use("/api/domain", domainRoute);
app.use("/api/sponsors", sponsorRoute);
app.use("/api/crm", creatorCrmRoutes);
app.use("/api/settings", protect, settingsRoutes);
app.use("/api/content", protect, contentRoutes);
app.use("/api/urls", protect, urlRoutes);
app.use("/api/ai", aiRoute);
app.use("/api/analytics", protect, analyticsRoutes);
app.use("/api/instagram", instagramRoutes);

// API Documentation
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swaggerOptions");

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCssUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css",
  }),
);

// ── HELPERS ──────────────────────────────────────────────────────────────────

function findServiceByKey(key) {
  return services.find((service) => service.key === key);
}

function buildShortenerViewModel(req, shortId = null, error = null) {
  return {
    service: findServiceByKey("url-shortener"),
    services,
    shortUrl: shortId
      ? `${req.protocol}://${req.get("host")}/u/${shortId}`
      : null,
    error,
    user: buildAccountViewModel(null, req.user),
  };
}

function buildAccountViewModel(userDoc, fallbackUser) {
  const name = userDoc?.name || fallbackUser?.name || "Creator";
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "CR";

  const passwordChangedAt =
    userDoc?.passwordChangedAt || userDoc?.updatedAt || null;
  let passwordAgeDays = null;
  if (passwordChangedAt) {
    passwordAgeDays = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(passwordChangedAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
  }

  const sub = userDoc?.subscription || {};
  const nextInvoice = sub.nextInvoiceDate
    ? new Date(sub.nextInvoiceDate)
    : null;

  return {
    id: fallbackUser.id,
    name,
    email: userDoc?.email || fallbackUser?.email || "",
    alias: userDoc?.alias || "",
    bio: userDoc?.bio || "",
    twoFactorEnabled: userDoc?.twoFactorEnabled || false,
    preferences: userDoc?.preferences || {
      appearanceMode: "light",
      interfaceDensity: "tactile",
      motionEffects: true,
      soundCues: false,
      autoSaveLinks: true,
    },
    passwordAgeDays,
    billing: {
      status: sub.status || "free",
      planName: sub.planName || "Free",
      priceMonthly: sub.priceMonthly ?? 0,
      nextInvoiceLabel: nextInvoice
        ? nextInvoice.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "No upcoming invoice",
      estimatedTotal: sub.priceMonthly
        ? `$${sub.priceMonthly.toFixed(2)} USD`
        : "$0.00 USD",
      cardBrand: sub.cardBrand || null,
      cardLast4: sub.cardLast4 || null,
      invoices: sub.invoices || [],
    },
    initials,
    scheduledDeletionAt: userDoc?.scheduledDeletionAt || null,
    deletionConfirmed: userDoc?.deletionConfirmed || false,
  };
}

async function buildAnalyticsViewModel(userId, shortLinkId = null, range = "30", creatorId = null) {
  const { buildUnifiedAnalyticsData } = require("./utils/analyticsHelper");
  return await buildUnifiedAnalyticsData(userId, { shortLinkId, range, creatorId });
}

function isGuestContributor(user) {
  return user?.role === "guest_contributor";
}

function buildEmptyInviteSummary() {
  return { total: 0, pending: 0, accepted: 0, expired: 0 };
}

// ── ROUTES ───────────────────────────────────────────────────────────────────

// Home / services hub
app.get("/", redirectIfAuthenticated, (req, res) => {
  res.render("services-hub", { services });
});

app.get("/services", (req, res) => {
  res.redirect("/");
});

app.get("/terms", (req, res) => {
  res.render("terms");
});

app.get("/privacy", (req, res) => {
  res.render("privacy-policy");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/confirm-deletion", (req, res) => {
  res.render("confirm-deletion");
});
app.get("/services/bio-builder", (req, res) => {
  res.render("bio-builder");
});

app.get("/changelog", (req, res) => {
  res.render("changelog");
});
