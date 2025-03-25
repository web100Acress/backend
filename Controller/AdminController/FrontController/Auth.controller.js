
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
        if (ContentWriterDetails.role == "ContentWriter") {
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
}

module.exports = AuthController;