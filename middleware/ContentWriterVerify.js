const jwt = require("jsonwebtoken");

const jwtVerification = async (req, res, next) => {
  // console.log("ContentWriterVerifyMiddleware Hit!!!");
  try {
    if (!req.headers.authorization) {
      console.log("No token provided");
      return res.status(401).json({success:false, message: "No token provided" });
    }

    // Extract token - handle both "Bearer token" and raw token formats
    let token = req.headers.authorization;
    
    // If it starts with "Bearer ", extract the token part
    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }
    
    // Remove any quotes from the token
    const token_without_quotes = token.replace(/"/g, "");
    
    if (!token_without_quotes) {
      console.log("No token after extraction");
      return res.status(401).json({success:false, message: "No token provided" });
    }

    // Verify using the same secret used when signing tokens
    const decoded = jwt.verify(
      token_without_quotes,
      process.env.JWT_SECRET || "aman123"
    );
    const role = (decoded.role || "").toString();
    const roleLc = role.toLowerCase();
    if (role === "ContentWriter" || role === "Admin" || roleLc === "blog") {
      req.user = decoded;
      return next(); // Critical return statement
    }

    return res.status(403).json({
      success: false,
      message: "Insufficient permissions"
    });

  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      console.log("Invalid token");
      return res.status(401).json({success:false, message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      console.log("Token expired");
      return res.status(401).json({success:false, message: "Token expired" });
    }
    console.log("Internal server error");
    return res.status(500).json({success:false, message: "Internal server error" });
  }
};

module.exports = jwtVerification;
