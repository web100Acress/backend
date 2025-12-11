const jwt = require("jsonwebtoken");

const jwtVerification = async (req, res, next) => {
  try {
    let token_without_quotes = null;
    
    // Check for x-access-token header first (used by admin panel)
    if (req.headers['x-access-token']) {
      token_without_quotes = req.headers['x-access-token'].replace(/"/g, "");
    }
    // Fallback to authorization header
    else if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      token_without_quotes = token.replace(/"/g, "");
    }
    
    if (!token_without_quotes) {
      console.log("No token provided");
      return res.status(401).json({success:false, message: "No token provided" });
    }

    // Verify using the same secret used when signing tokens
    const decoded = jwt.verify(
      token_without_quotes,
      process.env.JWT_SECRET || "aman123"
    );

    if (decoded.role?.toLowerCase() !== "admin") {
      return res
        .status(403)
        .json({success:false, message: "You are not authorized to perform this action" });
    }

    req.user = decoded;
    next();
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

// New middleware for HR/Admin access
const hrAdminVerify = async (req, res, next) => {
  try {
    let token_without_quotes = null;
    
    // Check for x-access-token header first (used by admin panel)
    if (req.headers['x-access-token']) {
      token_without_quotes = req.headers['x-access-token'].replace(/"/g, "");
    }
    // Fallback to authorization header
    else if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      token_without_quotes = token.replace(/"/g, "");
    }
    
    if (!token_without_quotes) {
      console.log("No token provided");
      return res.status(401).json({success:false, message: "No token provided" });
    }

    // Verify using the same secret used when signing tokens
    const decoded = jwt.verify(
      token_without_quotes,
      process.env.JWT_SECRET || "aman123"
    );

    // Allow Admin, HR, IT, and Super Admin roles (case-insensitive)
    const userRole = decoded.role?.toLowerCase();
    const allowedRoles = ["admin", "hr", "hr_manager", "blog_manager", "it", "superadmin", "super_admin"];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action"
      });
    }

    req.user = decoded;
    next();
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

// HR-Only middleware for complete HR access
const hrVerify = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({success:false, message: "No token provided" });
    }

    const token = req.headers.authorization.split(" ")[1];
    const token_without_quotes = token.replace(/"/g, "");
    if (!token_without_quotes) {
      return res.status(401).json({success:false, message: "No token provided" });
    }

    const decoded = jwt.verify(
      token_without_quotes,
      process.env.JWT_SECRET || "aman123"
    );

    // HR gets full access to HR section (case-insensitive)
    const userRole = decoded.role?.toLowerCase();
    if (userRole === "hr") {
      req.user = decoded;
      return next();
    }

    // Admin also gets access
    if (userRole === "admin") {
      req.user = decoded;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to perform this action"
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({success:false, message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({success:false, message: "Token expired" });
    }
    return res.status(500).json({success:false, message: "Internal server error" });
  }
};

// Admin and SalesHead middleware
const adminSalesHeadVerify = async (req, res, next) => {
  try {
    let token_without_quotes = null;
    
    // Check for x-access-token header first (used by admin panel)
    if (req.headers['x-access-token']) {
      token_without_quotes = req.headers['x-access-token'].replace(/"/g, "");
    }
    // Fallback to authorization header
    else if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      token_without_quotes = token.replace(/"/g, "");
    }
    
    if (!token_without_quotes) {
      console.log("No token provided");
      return res.status(401).json({success:false, message: "No token provided" });
    }

    // Verify using the same secret used when signing tokens
    const decoded = jwt.verify(
      token_without_quotes,
      process.env.JWT_SECRET || "aman123"
    );

    // Allow Admin and SalesHead roles (case-insensitive)
    const userRole = decoded.role?.toLowerCase();
    if (userRole !== "admin" && userRole !== "saleshead" && userRole !== "sales_head") {
      return res
        .status(403)
        .json({success:false, message: "You are not authorized to perform this action" });
    }

    req.user = decoded;
    next();
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
module.exports.hrAdminVerify = hrAdminVerify;
module.exports.hrVerify = hrVerify;
module.exports.adminSalesHeadVerify = adminSalesHeadVerify;
