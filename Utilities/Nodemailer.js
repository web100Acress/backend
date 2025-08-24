const nodemailer = require("nodemailer");
require("dotenv").config();

const host = process.env.SMTP_HOST || "smtpout.secureserver.net";
const port = parseInt(process.env.SMTP_PORT || "465", 10);
const secure = (process.env.SMTP_SECURE || `${port === 465}`).toString() === "true";
const user = process.env.SMTP_USER; 
const pass = process.env.SMTP_PASS; 

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  secureConnection: false, 
  tls: { ciphers: "SSLv3" },
  requireTLS: true,
  debug: process.env.SMTP_DEBUG === "true",
  auth: user && pass ? { user, pass } : undefined,
});

module.exports = transporter;