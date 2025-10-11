
class AuthController {
    static isAdminVerify = async (req, res) => {
        const AdminDetails = req.user;
        if (AdminDetails.role == "Admin") {
            return res.status(200).json({
                success: true,
                message: "Admin is verified !",
            });
        } else {
            return res.status(401).json({
                success: false,
                message: "You are not authorized to change the role",
            });
        }
    }
    static isContentWriterVerify = async (req, res) => {
        const ContentWriterDetails = req.user;
        if (ContentWriterDetails.role == "ContentWriter" || ContentWriterDetails.role == "Admin") {
            return res.status(200).json({
                success: true,
                message: "ContentWriter is verified !",
            });
        } else {
            return res.status(401).json({
                success: false,
                message: "You are not authorized to change the role",
            });
        }
    }
    static isHrVerify = async (req, res) => {
        try {
            // Check if authorization header exists
            if (!req.headers.authorization) {
                return res.status(401).json({
                    success: false,
                    message: "No token provided"
                });
            }

            // Extract and verify token
            const jwt = require("jsonwebtoken");
            const token = req.headers.authorization.split(" ")[1];
            const token_without_quotes = token.replace(/"/g, "");

            if (!token_without_quotes) {
                return res.status(401).json({
                    success: false,
                    message: "No token provided"
                });
            }

            const decoded = jwt.verify(
                token_without_quotes,
                process.env.JWT_SECRET || "aman123"
            );

            // Check if user has HR or Admin role (case-insensitive)
            const userRole = (decoded.role || "").toString().toLowerCase();
            if (userRole === "hr" || userRole === "admin") {
                return res.status(200).json({
                    success: true,
                    message: "HR is verified!",
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: "You are not authorized to access HR dashboard",
                });
            }
        } catch (error) {
            if (error.name === "JsonWebTokenError") {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token"
                });
            }
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Token expired"
                });
            }
            console.log("HR verification error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
}

module.exports = AuthController;