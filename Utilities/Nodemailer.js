const nodemailer = require("nodemailer");
require("dotenv").config();

// Support both generic SMTP_* and AWS SES SES_SMTP_* style envs
const sesRegion = process.env.SES_REGION || process.env.AWS_SES_REGION;
const sesUser = process.env.SES_SMTP_USER || process.env.AWS_SES_SMTP_USER;
const sesPass = process.env.SES_SMTP_PASS || process.env.AWS_SES_SMTP_PASS;

// Determine host/port/secure
let host = process.env.SMTP_HOST;
let port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
let secure;

// If SES creds provided and no explicit SMTP_HOST given, default to SES SMTP endpoint
if (!host && sesRegion) {
  host = `email-smtp.${sesRegion}.amazonaws.com`;
}

// Default ports depending on host
if (!port) {
  if (host && host.includes("email-smtp.")) {
    // SES recommended STARTTLS is 587
    
    port = 587;
  } else {
    // Fallback default
    port = 465;
  }
}

// secure true for 465, false otherwise unless explicitly set
if (typeof process.env.SMTP_SECURE !== "undefined") {
  secure = process.env.SMTP_SECURE === "true";
} else {
  secure = port === 465;
}

// Auth selection priority: explicit SMTP_USER/PASS, else SES creds
const user = process.env.SMTP_USER || sesUser;
const pass = process.env.SMTP_PASS || sesPass;

const transporter = nodemailer.createTransport({
  host: host || "smtpout.secureserver.net",
  port,
  secure,
  requireTLS: !secure, // require STARTTLS on 587
  // Keep TLS simple and compatible with SES and most providers
  // Do not force legacy ciphers
  debug: process.env.SMTP_DEBUG === "true",
  auth: user && pass ? { user, pass } : undefined,
});

module.exports = transporter;