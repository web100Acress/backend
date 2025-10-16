const registerModel = require("../../../models/register/registerModel");
const leaveRequestModel = require("../../../models/hr/leaveRequest");

class HrController {
  // Get all registered users for HR management
  static getAllUsers = async (req, res) => {
    try {
      const users = await registerModel.find({})
        .select('-password -token -__v') // Exclude sensitive fields
        .sort({ createdAt: -1 }); // Sort by newest first

      return res.status(200).json({
        message: "Users retrieved successfully",
        data: users,
        total: users.length
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  };

  // Get all leave requests for HR management
  static getAllLeaveRequests = async (req, res) => {
    try {
      const leaveRequests = await leaveRequestModel.find({})
        .populate('userId', 'name email mobile role')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: "Leave requests retrieved successfully",
        data: leaveRequests,
        total: leaveRequests.length
      });
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  };

  // Approve or reject leave request
  static updateLeaveStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, hrComments } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          message: "Invalid status. Must be 'approved' or 'rejected'"
        });
      }

      const leaveRequest = await leaveRequestModel.findByIdAndUpdate(
        id,
        {
          status: status,
          hrComments: hrComments || '',
          reviewedAt: new Date(),
          reviewedBy: req.user?.user_id || 'HR'
        },
        { new: true }
      ).populate('userId', 'name email mobile');

      if (!leaveRequest) {
        return res.status(404).json({
          message: "Leave request not found"
        });
      }

      return res.status(200).json({
        message: `Leave request ${status} successfully`,
        data: leaveRequest
      });
    } catch (error) {
      console.error("Error updating leave status:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  };

  // Get leave statistics
  static getLeaveStats = async (req, res) => {
    try {
      const stats = await leaveRequestModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalRequests = stats.reduce((sum, stat) => sum + stat.count, 0);
      const pendingCount = stats.find(s => s._id === 'pending')?.count || 0;
      const approvedCount = stats.find(s => s._id === 'approved')?.count || 0;
      const rejectedCount = stats.find(s => s._id === 'rejected')?.count || 0;

      return res.status(200).json({
        message: "Leave statistics retrieved successfully",
        data: {
          total: totalRequests,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount
        }
      });
    } catch (error) {
      console.error("Error fetching leave stats:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  };
}

module.exports = HrController;
