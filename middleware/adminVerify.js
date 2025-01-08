const jwt = require("jsonwebtoken");

const jwtVerification = async (req, res, next) => {
  try {
    console.log("Headers: ",req.headers);
    if (!req.headers.authorization) {
      console.log("No token provided");
      return res.status(401).json({ message: "No token provided" });
    }

    // Extract token - handle both "Bearer token" and raw token formats
    const token = req.headers.authorization.split(' ')[1];
    const token_without_quotes = token.replace(/"/g, '');
    // console.log(token_without_quotes);
    if (!token_without_quotes) {
      // console.log("No token after extraction");
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token_without_quotes, "amitchaudhary100");
    // console.log("Decoded: ",decoded);
    
    if (decoded.role !== "Admin") {
      return res.status(403).json({ message: "You are not authorized to perform this action" });
    }

    req.user = decoded;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = jwtVerification;