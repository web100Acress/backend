const express = require("express");
const path = require("path");
const compression = require("compression");
const connectDB = require("./db/connect_db");
const router = require("./routes/web");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const bodyParser = require("body-parser");
const errorHandler = require("./middleware/errorMiddleware");
const { connectRedis } = require("./config/redis");
const uploadLimits = require("./config/uploadLimits");
const PostUser = require("./models/postProperty/post");
const { sendEmail } = require("./Utilities/s3HelperUtility");
const axios = require("axios");
const app = express();

// Enhanced caching middleware for high-traffic endpoints
// TODO: MIGRATE TO REDIS FOR PRODUCTION
// Current: In-memory Map cache (resets on restart, single-server only)
// Production goal: Redis cache (persistent, distributed, scalable)
// Install: npm install redis
// Replace Map with Redis client for better production performance
const cache = new Map();
const MAX_CACHE_SIZE = 1000; // Limit cache size for production

const { redisClient } = require("./config/redis");

const cacheMiddleware = (duration = 30000) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') return next();

    // Normalize cache key - remove timestamp parameters to prevent cache bypass
    const originalUrl = req.originalUrl || req.url;
    const normalizedUrl = originalUrl.replace(/[?&]_t=\d+/g, '');
    const key = `api_cache:${normalizedUrl}`;
    
    try {
      // Try Redis first
      if (redisClient.isOpen) {
        const cached = await redisClient.get(key);
        if (cached) {
          console.log(`⚡ Redis hit for: ${key}`);
          return res.json(JSON.parse(cached));
        }
      } else {
        // Fallback to in-memory cache if Redis is down
        const cached = cache.get(key);
        if (cached && (Date.now() - cached.timestamp < duration)) {
          console.log(`🚀 In-memory hit for: ${key}`);
          return res.json(cached.data);
        }
      }
    } catch (err) {
      console.error('Cache middleware error:', err);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      const self = this;
      
      // Async cache storage
      (async () => {
        try {
          if (redisClient.isOpen) {
            await redisClient.setEx(key, Math.floor(duration / 1000), JSON.stringify(data));
            console.log(`💾 Redis cached: ${key}`);
          } else {
            if (cache.size >= MAX_CACHE_SIZE) {
              const firstKey = cache.keys().next().value;
              cache.delete(firstKey);
            }
            cache.set(key, { data, timestamp: Date.now() });
            console.log(`📦 In-memory cached: ${key}`);
          }
        } catch (err) {
          console.error('Failed to store in cache:', err);
        }
      })();
      
      return originalJson.call(self, data);
    };
    
    next();
  };
};

// Clear cache periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutes
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`🧹 Cache cleanup: Removed ${keysToDelete.length} expired entries. Current size: ${cache.size}`);
}, 60000); // Clean every minute

// Load environment variables BEFORE using them
require("dotenv").config();

// Initialize Redis connection with proper error handling
(async () => {
  try {
    await connectRedis();
    console.log("🔥 Redis initialization completed");
  } catch (error) {
    console.error("💥 Redis initialization failed:", error.message);
    console.log("🔄 Continuing with in-memory cache only...");
  }
})();
const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";
const Port = isProd ? (process.env.PORT || 3500) : 3500;
const http = require("http");
const { Server } = require("socket.io");

// Create a rate limit rule - EMERGENCY DISABLED FOR PRODUCTION
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100000, // Extremely high limit - effectively disabled
  message: {
    success: false,
    message: "Too many requests, please try again after some time."
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting completely during emergency
  skip: () => {
    // TEMPORARILY DISABLE ALL RATE LIMITING
    return true;
  },
});

// compress the response
app.use(compression());
// Parse allowed origins from environment variable or use defaults
const allowedOrigins = (process.env.CORS_ORIGIN || "https://100acress.com,https://www.100acress.com,http://localhost:3000,http://localhost:5000,https://api.100acress.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Add API domain and project domains to allowed origins
const domains = [
  '100acress.com',
  'www.100acress.com',
  'api.100acress.com',
  '100acress.in',
  'www.100acress.in',
  '100acress.org',
  'www.100acress.org',
  'localhost:5000'
];

// Add all variations (http, https, with/without www)
domains.forEach(domain => {
  const variants = [
    `http://${domain}`,
    `https://${domain}`,
    domain
  ];

  variants.forEach(variant => {
    if (!allowedOrigins.includes(variant)) {
      allowedOrigins.push(variant);
      console.log('Added domain to allowed origins:', variant);
    }
  });
});

// Cache for allowed origins to improve performance
const allowedOriginsCache = new Map();

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return cb(null, true);

    // Check cache first
    if (allowedOriginsCache.has(origin)) {
      return cb(null, allowedOriginsCache.get(origin));
    }

    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      // Only log the first occurrence of each origin to reduce noise
      if (!allowedOriginsCache.has(origin)) {
        console.log('Allowing CORS for development origin:', origin);
        allowedOriginsCache.set(origin, true);
      }
      return cb(null, true);
    }

    // Normalize the origin to handle www and non-www versions
    const normalizedOrigin = origin
      .replace('http://', '')
      .replace('https://', '')
      .replace('www.', '');

    // Check if the origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = allowed
        .replace('http://', '')
        .replace('https://', '')
        .replace('www.', '');

      // Allow all subdomains of the main domain
      if (normalizedOrigin.endsWith('100acress.com') ||
        normalizedOrigin.endsWith('100acress.in') ||
        normalizedOrigin.endsWith('100acress.org')) {
        console.log('Allowing subdomain origin:', origin);
        return true;
      }

      return normalizedOrigin === normalizedAllowed ||
        normalizedOrigin.endsWith(normalizedAllowed);
    });

    if (isAllowed || allowedOrigins.includes('*')) {
      // Cache the allowed origin
      allowedOriginsCache.set(origin, true);
      return cb(null, true);
    }

    console.warn('CORS blocked for origin:', origin, 'Allowed origins:', allowedOrigins);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
    "Origin",
    "x-access-token",
    "X-Forwarded-For"
  ],
  exposedHeaders: [
    "Content-Range",
    "X-Content-Range",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset"
  ],
  credentials: true,
  maxAge: 3600, // Cache preflight for 1 hour
  optionsSuccessStatus: 204
};

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);

    // Log rate limit headers if present
    const limit = res.getHeader('X-RateLimit-Limit');
    const remaining = res.getHeader('X-RateLimit-Remaining');
    if (limit && remaining) {
      console.log(`  Rate Limit: ${remaining}/${limit} remaining`);
    }
  });

  next();
});

// Apply CORS middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable preflight for all routes

// Handle preflight requests more efficiently
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // If the CORS middleware already handled/attached headers, do not override them.
    // Duplicate Access-Control-* headers can cause browsers to reject the preflight.
    if (!res.getHeader('Access-Control-Allow-Origin')) {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    }
    if (!res.getHeader('Access-Control-Allow-Methods')) {
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }
    if (!res.getHeader('Access-Control-Allow-Headers')) {
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token');
    }
    // Only set credentials header if an Origin is present (never pair credentials=true with '*').
    if (!res.getHeader('Access-Control-Allow-Credentials') && req.headers.origin) {
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    if (!res.getHeader('Access-Control-Max-Age')) {
      res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    }
    return res.status(204).end();
  }
  next();
});

// Apply the rate limit rule to all requests
app.use(limiter);

app.use(errorHandler);

// Middleware for parsing JSON request bodies
app.use(express.json({ limit: "100mb" })); // Express's built-in middleware for JSON

// Middleware for parsing URL-encoded form data
app.use(bodyParser.urlencoded({ extended: false, limit: "100mb" }));

// database connection
connectDB();

// ---------------------------
// Email verification reminders (production scheduler)
// 10 minutes -> 24 hours -> 7 days -> weekly until verified
// Uses DB locks to avoid duplicates and works across restarts
// ---------------------------
const getFrontendBaseUrl = () => {
  return (process.env.FRONTEND_URL || 'https://www.100acress.com').replace(/\/$/, '');
};

const buildVerifyUrl = (email) => {
  return `${getFrontendBaseUrl()}/auth/signup/email-verification/?email=${encodeURIComponent(email)}`;
};

const getPostPropertyUrl = () => {
  const fromEnv = process.env.POST_PROPERTY_URL;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();
  return `${getFrontendBaseUrl()}/postproperty`;
};

const postPropertyRemindersEnabled = () => {
  const v = process.env.POST_PROPERTY_REMINDERS_ENABLED;
  if (v === undefined || v === null || String(v).trim() === '') return true;
  return String(v).trim().toLowerCase() !== 'false';
};

const canSendWhatsApp = () => {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
};

const normalizeWhatsAppNumber = (value) => {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  let cleaned = raw.replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.slice(1).replace(/\D/g, '');
  } else {
    cleaned = cleaned.replace(/\D/g, '');
    const cc = (process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91').replace(/\D/g, '');
    cleaned = cc ? `+${cc}${cleaned}` : `+${cleaned}`;
  }
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 10) return null;
  return cleaned;
};

const sendWhatsAppText = async ({ toMobile, body }) => {
  try {
    if (!canSendWhatsApp()) return false;
    const to = normalizeWhatsAppNumber(toMobile);
    if (!to) return false;
    const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: to.replace(/^\+/, ''),
        type: 'text',
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    return true;
  } catch (error) {
    console.log('WhatsApp reminder send error', error?.response?.data || error?.message || error);
    return false;
  }
};

const sendVerifyReminderEmail = async ({ email, name, stageLabel }) => {
  try {
    const from = 'support@100acress.com';
    const to = email;
    const subject = stageLabel
      ? `Reminder (${stageLabel}): Verify your 100acress account`
      : 'Reminder: Verify your 100acress account';
    const safeName = name || email?.split('@')?.[0] || 'User';
    const verifyUrl = buildVerifyUrl(email);
    const html = `<!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify your account</title>
      </head>
      <body style="margin:0;padding:0;background:#0b1020;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b1020;padding:24px 12px;">
          <tr><td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;width:100%;">
              <tr>
                <td style="background:linear-gradient(135deg,#111827 0%, #0b1020 45%, #111827 100%); border:1px solid rgba(255,255,255,0.10); border-radius:18px; overflow:hidden;">
                  <div style="padding:28px 26px 22px 26px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#f9fafb;">
                    <div style="display:inline-block;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);font-size:12px;color:#d1d5db;">Reminder</div>
                    <h1 style="margin:14px 0 10px 0;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;">Hello ${safeName},</h1>
                    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#d1d5db;">Please verify your email to activate your account.</p>
                    <div style="margin:18px 0 18px 0;">
                      <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(90deg,#2563eb 0%, #7c3aed 100%);color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700;font-size:14px;">Verify your account</a>
                    </div>
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">If the button doesn’t work, copy & paste this link:<br /><span style="word-break:break-all;color:#c7d2fe;">${verifyUrl}</span></p>
                  </div>
                  <div style="padding:14px 26px 22px 26px;border-top:1px solid rgba(255,255,255,0.08); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#9ca3af; font-size:12px; line-height:1.6;">© ${new Date().getFullYear()} 100acress.</div>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>`;
    await sendEmail(to, from, [], subject, html, false);
    return true;
  } catch (e) {
    console.log('Email reminder send error', e);
    return false;
  }
};

const sendVerifyReminderWhatsApp = async ({ mobile, email, name, stageLabel }) => {
  const safeName = name || email?.split('@')?.[0] || 'User';
  const verifyUrl = buildVerifyUrl(email);
  const prefix = stageLabel ? `Reminder (${stageLabel})` : 'Reminder';
  const msg = `${prefix}: ${safeName}\n\nPlease verify your account:\n${verifyUrl}`;
  return sendWhatsAppText({ toMobile: mobile, body: msg });
};

const sendPostPropertyReminderEmail = async ({ email, name, stageLabel }) => {
  try {
    const from = 'support@100acress.com';
    const to = email;
    const subject = stageLabel
      ? `Post Property (${stageLabel}): Publish your listing on 100acress`
      : 'Post Property: Publish your listing on 100acress';
    const safeName = name || email?.split('@')?.[0] || 'User';
    const postUrl = getPostPropertyUrl();
    const html = `<!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Post Property</title>
      </head>
      <body style="margin:0;padding:0;background:#071a12;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#071a12;padding:24px 12px;">
          <tr><td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;width:100%;">
              <tr>
                <td style="background:linear-gradient(135deg,#052e1c 0%, #071a12 55%, #052e1c 100%); border:1px solid rgba(255,255,255,0.10); border-radius:18px; overflow:hidden;">
                  <div style="padding:28px 26px 22px 26px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#ecfdf5;">
                    <div style="display:inline-block;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);font-size:12px;color:#d1d5db;">Post Property</div>
                    <h1 style="margin:14px 0 10px 0;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;">Hi ${safeName},</h1>
                    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#bbf7d0;">Your account is verified. Post your property to start receiving enquiries.</p>
                    <div style="margin:18px 0 18px 0;">
                      <a href="${postUrl}" style="display:inline-block;background:linear-gradient(90deg,#16a34a 0%, #0ea5e9 100%);color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:800;font-size:14px;">Post Property</a>
                    </div>
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#a7f3d0;">If the button doesn’t work, copy & paste this link:<br /><span style="word-break:break-all;color:#99f6e4;">${postUrl}</span></p>
                  </div>
                  <div style="padding:14px 26px 22px 26px;border-top:1px solid rgba(255,255,255,0.08); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#a7f3d0; font-size:12px; line-height:1.6;">© ${new Date().getFullYear()} 100acress.</div>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>`;
    await sendEmail(to, from, [], subject, html, false);
    return true;
  } catch (e) {
    console.log('Post property reminder email send error', e);
    return false;
  }
};

const sendPostPropertyReminderWhatsApp = async ({ mobile, email, name, stageLabel }) => {
  const safeName = name || email?.split('@')?.[0] || 'User';
  const postUrl = getPostPropertyUrl();
  const prefix = stageLabel ? `Post Property (${stageLabel})` : 'Post Property';
  const msg = `${prefix}: ${safeName}\n\nPost your property here:\n${postUrl}`;
  return sendWhatsAppText({ toMobile: mobile, body: msg });
};

const processStage = async ({ stageLabel, dueMs, lockField, sentField, extraQuery = {}, weekly = false }) => {
  const now = new Date();
  const lockStaleMs = 30 * 60 * 1000; // 30 minutes
  const staleBefore = new Date(Date.now() - lockStaleMs);
  const sentQuery = { $or: [{ [sentField]: null }, { [sentField]: { $exists: false } }] };
  const lockQuery = {
    $or: [
      { [lockField]: null },
      { [lockField]: { $exists: false } },
      { [lockField]: { $lt: staleBefore } },
    ],
  };

  // For weekly, dueMs is evaluated against last weekly sent or 7d sent
  const query = {
    emailVerified: false,
    ...extraQuery,
    $and: [sentQuery, lockQuery],
  };

  const batchSize = Math.max(1, Number(process.env.VERIFY_REMINDER_BATCH_SIZE || 50));
  const candidates = await PostUser.find(query)
    .select('email name mobile createdAt verifyReminder24hSentAt verifyReminderWeeklySentAt')
    .limit(batchSize)
    .lean();

  for (const u of candidates) {
    try {
      if (!u.email) continue;

      // Eligibility check by time
      const createdAtMs = new Date(u.createdAt).getTime();
      if (!weekly) {
        if (Date.now() - createdAtMs < dueMs) continue;
      } else {
        const anchor = u.verifyReminderWeeklySentAt || u.verifyReminder24hSentAt;
        if (!anchor) continue;
        const anchorMs = new Date(anchor).getTime();
        if (Date.now() - anchorMs < dueMs) continue;
      }

      // Acquire lock atomically
      const locked = await PostUser.findOneAndUpdate(
        {
          _id: u._id,
          emailVerified: false,
          $and: [
            { $or: [{ [sentField]: null }, { [sentField]: { $exists: false } }] },
            {
              $or: [
                { [lockField]: null },
                { [lockField]: { $exists: false } },
                { [lockField]: { $lt: staleBefore } },
              ],
            },
          ],
        },
        { $set: { [lockField]: now } },
        { new: false }
      );
      if (!locked) continue;

      await sendVerifyReminderEmail({ email: u.email, name: u.name, stageLabel });
      await sendVerifyReminderWhatsApp({ mobile: u.mobile, email: u.email, name: u.name, stageLabel });

      await PostUser.updateOne(
        { _id: u._id },
        { $set: { [sentField]: new Date() }, $unset: { [lockField]: 1 } }
      );
    } catch (err) {
      try {
        await PostUser.updateOne({ _id: u._id }, { $unset: { [lockField]: 1 } });
      } catch { }
      console.log('Reminder stage processing error', stageLabel, err);
    }
  }
};

const processVerificationReminders = async () => {
  try {
    const tenMinMs = 10 * 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    await processStage({
      stageLabel: '10 min',
      dueMs: tenMinMs,
      lockField: 'verifyReminder10mLockAt',
      sentField: 'verifyReminder10mSentAt',
    });

    await processStage({
      stageLabel: '24 hours',
      dueMs: dayMs,
      lockField: 'verifyReminder24hLockAt',
      sentField: 'verifyReminder24hSentAt',
      // stage gating: only after 10m sent
      extraQuery: { verifyReminder10mSentAt: { $ne: null } },
    });

    // Weekly reminders after the 24h reminder has been sent
    await processStage({
      stageLabel: 'Weekly',
      dueMs: weekMs,
      lockField: 'verifyReminderWeeklyLockAt',
      sentField: 'verifyReminderWeeklySentAt',
      weekly: true,
      // stage gating: only after 24h sent
      extraQuery: { verifyReminder24hSentAt: { $ne: null } },
    });

    // ---------------------------
    // Post Property reminders after verification (only if no property posted)
    // 10 minutes -> 24 hours -> 7 days -> weekly until the first property is posted
    // ---------------------------
    const hasNoPostedPropertyQuery = {
      // Safety: only remind users verified after this feature was added.
      // Older users might have emailVerified=true but emailVerifiedAt=null.
      emailVerifiedAt: { $ne: null },
      $or: [
        { postProperty: { $exists: false } },
        { postProperty: { $size: 0 } },
      ],
    };

    const processPostPropertyStage = async ({ stageLabel, dueMs, lockField, sentField, extraQuery = {}, weekly = false }) => {
      if (!postPropertyRemindersEnabled()) return;
      const now = new Date();
      const lockStaleMs = 30 * 60 * 1000;
      const staleBefore = new Date(Date.now() - lockStaleMs);

      const batchSize = Math.max(1, Number(process.env.VERIFY_REMINDER_BATCH_SIZE || 50));
      const candidates = await PostUser.find({
        emailVerified: true,
        ...hasNoPostedPropertyQuery,
        ...extraQuery,
        $and: [
          { $or: [{ [sentField]: null }, { [sentField]: { $exists: false } }] },
          {
            $or: [
              { [lockField]: null },
              { [lockField]: { $exists: false } },
              { [lockField]: { $lt: staleBefore } },
            ],
          },
        ],
      })
        .select('email name mobile emailVerifiedAt createdAt postPropertyReminder24hSentAt postPropertyReminderWeeklySentAt')
        .limit(batchSize)
        .lean();

      for (const u of candidates) {
        try {
          if (!u.email) continue;
          const anchorDate = u.emailVerifiedAt || u.createdAt;

          if (!weekly) {
            if (Date.now() - new Date(anchorDate).getTime() < dueMs) continue;
          } else {
            const anchor = u.postPropertyReminderWeeklySentAt || u.postPropertyReminder24hSentAt || u.emailVerifiedAt || u.createdAt;
            if (!anchor) continue;
            if (Date.now() - new Date(anchor).getTime() < dueMs) continue;
          }

          const locked = await PostUser.findOneAndUpdate(
            {
              _id: u._id,
              emailVerified: true,
              ...hasNoPostedPropertyQuery,
              ...extraQuery,
              $and: [
                { $or: [{ [sentField]: null }, { [sentField]: { $exists: false } }] },
                {
                  $or: [
                    { [lockField]: null },
                    { [lockField]: { $exists: false } },
                    { [lockField]: { $lt: staleBefore } },
                  ],
                },
              ],
            },
            { $set: { [lockField]: now } },
            { new: false }
          );
          if (!locked) continue;

          await sendPostPropertyReminderEmail({ email: u.email, name: u.name, stageLabel });
          await sendPostPropertyReminderWhatsApp({ mobile: u.mobile, email: u.email, name: u.name, stageLabel });

          await PostUser.updateOne(
            { _id: u._id },
            { $set: { [sentField]: new Date() }, $unset: { [lockField]: 1 } }
          );
        } catch (err) {
          try {
            await PostUser.updateOne({ _id: u._id }, { $unset: { [lockField]: 1 } });
          } catch { }
          console.log('Post property reminder stage processing error', stageLabel, err);
        }
      }
    };

    await processPostPropertyStage({
      stageLabel: '24 hours',
      dueMs: dayMs,
      lockField: 'postPropertyReminder24hLockAt',
      sentField: 'postPropertyReminder24hSentAt',
    });

    await processPostPropertyStage({
      stageLabel: 'Weekly',
      dueMs: weekMs,
      lockField: 'postPropertyReminderWeeklyLockAt',
      sentField: 'postPropertyReminderWeeklySentAt',
      weekly: true,
      // stage gating: only after 24h sent
      extraQuery: { postPropertyReminder24hSentAt: { $ne: null } },
    });
  } catch (err) {
    console.log('processVerificationReminders error', err);
  }
};

// Run every 5 minutes (production-grade; survives restarts)
const reminderIntervalMs = Math.max(60_000, Number(process.env.VERIFY_REMINDER_INTERVAL_MS || 5 * 60 * 1000));
setInterval(() => {
  processVerificationReminders();
}, reminderIntervalMs);

// Initial run after startup (give DB time to connect)
setTimeout(() => {
  processVerificationReminders();
}, 30_000);

app.set("trust proxy", 1);

// cookie
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Add caching for high-traffic endpoints - Production optimized strategy
// Heavy data endpoints - longer cache for better performance
app.use('/project/viewAll/data', cacheMiddleware(60 * 1000)); // 1 minute cache
app.use('/project/featured', cacheMiddleware(60 * 1000));
app.use('/project/trending', cacheMiddleware(60 * 1000));
app.use('/project/luxury', cacheMiddleware(60 * 1000));
app.use('/project/upcoming', cacheMiddleware(60 * 1000));
app.use('/project/commercial', cacheMiddleware(60 * 1000));
app.use('/project/budgethomes', cacheMiddleware(60 * 1000));
app.use('/project/scoplots', cacheMiddleware(60 * 1000));
app.use('/project/affordable', cacheMiddleware(60 * 1000));
app.use('/project/View', cacheMiddleware(5 * 60 * 1000)); // 5 minutes cache for project details
app.use('/project/comingsoon', cacheMiddleware(60 * 1000));
app.use('/project/city', cacheMiddleware(60 * 1000));
app.use('/project/spotlight', cacheMiddleware(60 * 1000));
app.use('/project/suggested', cacheMiddleware(60 * 1000));

// Blog content - medium cache
app.use('/blog/view', cacheMiddleware(30 * 1000)); // 30 seconds cache

// Search and dynamic data - short cache for freshness
app.use('/property/search', cacheMiddleware(10 * 1000)); // 10 seconds cache
app.use('/property/view', cacheMiddleware(60 * 1000)); // 1 minute cache for property details
app.use('/property/buy/ViewAll', cacheMiddleware(60 * 1000)); // 1 minute cache for resale listings
app.use('/property/rent/viewAll', cacheMiddleware(60 * 1000)); // 1 minute cache for rental listings
app.use('/search/suggestions', cacheMiddleware(10 * 1000)); // 10 seconds cache
app.use('/data/filter', cacheMiddleware(10 * 1000)); // 10 seconds cache
app.use('/project/projectsearch', cacheMiddleware(60 * 1000)); // Increased to 60 seconds for better performance
app.use('/project/category', cacheMiddleware(10 * 1000)); // 10 seconds cache

// Static content - longer cache
app.use('/about', cacheMiddleware(60 * 1000)); // 1 minute cache
app.use('/contact', cacheMiddleware(60 * 1000)); // 1 minute cache
app.use('/agent', cacheMiddleware(60 * 1000)); // 1 minute cache
app.use('/career/opening', cacheMiddleware(60 * 1000)); // 1 minute cache

// Analytics and monitoring - no cache for real-time data
app.use('/snapShot', cacheMiddleware(5 * 1000)); // 5 seconds cache
app.use('/projectCount', cacheMiddleware(5 * 1000)); // 5 seconds cache

// User data - short cache for privacy
app.use('/postPerson/users/', cacheMiddleware(15 * 1000)); // 15 seconds cache

// Banners and static assets - longer cache
app.use('/api/banners/active', cacheMiddleware(60 * 1000)); // 1 minute cache
app.use('/api/small-banners/active', cacheMiddleware(60 * 1000)); // 1 minute cache
app.use('/api/side-banners/active', cacheMiddleware(60 * 1000)); // 1 minute cache

// Critical endpoints - longer cache to prevent spam
app.use('/api/project-orders', cacheMiddleware(5 * 60 * 1000)); // 5 minutes cache
app.use('/health', cacheMiddleware(30 * 1000)); // 30 seconds cache

// Router Link
app.use("/", router);

// Serve uploaded files statically so avatar URLs like /uploads/<file> work
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware - should be after all other middleware and routes
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Not allowed by CORS',
      allowedOrigins: allowedOrigins
    });
  }

  // Handle rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: err.retryAfter || 60 // seconds
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Create HTTP server and bind Socket.IO with timeout configuration
const server = http.createServer(app);
server.timeout = uploadLimits.timeout;
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

// Make io available inside routes via req.app.get('io')
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

server.listen(Port, () => {
  console.log(`App Listen On the ${Port} (env NODE_ENV='${process.env.NODE_ENV || ''}', effective PORT='${Port}')`);
});
