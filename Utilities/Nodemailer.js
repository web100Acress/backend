const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net",
    secure: true,
    secureConnection: false, // TLS requires secureConnection to be false
    tls: {
        ciphers:'SSLv3'
    },
    requireTLS:true,
    debug: true,
    port: 465,
    auth: {
      user: "support@100acress.com",
      pass: "Mission@#2025",
    },
  });

module.exports = transporter;