const jwt = require("jsonwebtoken");

const jwtVerification = async (req, res, next) => {
  console.log("ContentWriterVerifyMiddleware Hit!!!");
  try {
    if (!req.headers.authorization) {
      console.log("No token provided");
      return res.status(401).json({success:false, message: "No token provided" });
    }

    // Extract token - handle both "Bearer token" and raw token formats
    const token = req.headers.authorization.split(" ")[1];
    const token_without_quotes = token.replace(/"/g, "");
    // console.log(token_without_quotes);
    if (!token_without_quotes) {
      // console.log("No token after extraction");
      return res.status(401).json({success:false, message: "No token provided" });
    }

    const decoded = jwt.verify(token_without_quotes, "amitchaudhary100");
    console.log("Decoded: ",decoded);

    if (["ContentWriter", "Admin"].includes(decoded.role)) {
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
