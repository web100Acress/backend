const ProjectOrder = require('../../models/ProjectOrder');

class ProjectOrderController {
  // Get all project orders
  static getProjectOrders = async (req, res) => {
    try {
      const projectOrders = await ProjectOrder.findOne();
      
      if (!projectOrders) {
        // Return default data if no data exists
        const defaultData = {
          luxury: [
            { id: 1, name: "Elan The Emperor", order: 1, isActive: true },
            { id: 2, name: "Experion The Trillion", order: 2, isActive: true },
            { id: 3, name: "Birla Arika", order: 3, isActive: true },
            { id: 4, name: "DLF Privana North", order: 4, isActive: true }
          ],
          trending: [
            { id: 5, name: "Indiabulls Estate Club", order: 1, isActive: true },
            { id: 6, name: "Signature Global Twin Tower DXP", order: 2, isActive: true },
            { id: 7, name: "Tarc Ishva", order: 3, isActive: true }
          ],
          affordable: [
            { id: 8, name: "Wal 92", order: 1, isActive: true },
            { id: 9, name: "TLC The First Acre", order: 2, isActive: true }
          ],
          sco: [
            { id: 10, name: "SCO Plot 1", order: 1, isActive: true },
            { id: 11, name: "SCO Plot 2", order: 2, isActive: true }
          ],
          commercial: [
            { id: 12, name: "Commercial Project 1", order: 1, isActive: true },
            { id: 13, name: "Commercial Project 2", order: 2, isActive: true }
          ],
          budget: [
            { id: 14, name: "Budget Project 1", order: 1, isActive: true },
            { id: 15, name: "Budget Project 2", order: 2, isActive: true }
          ],
          recommended: [
            { id: 16, name: "Recommended Project 1", order: 1, isActive: true },
            { id: 17, name: "Recommended Project 2", order: 2, isActive: true }
          ],
          desiredLuxury: [
            { id: 18, name: "Desired Luxury 1", order: 1, isActive: true },
            { id: 19, name: "Desired Luxury 2", order: 2, isActive: true }
          ],
          budgetPlots: [
            { id: 20, name: "Budget Plot 1", order: 1, isActive: true },
            { id: 21, name: "Budget Plot 2", order: 2, isActive: true }
          ],
          // Status-based orders
          newlaunch: [],
          upcoming: [],
          comingsoon: [],
          underconstruction: [],
          readytomove: []
        };
        
        return res.status(200).json({
          success: true,
          message: "Project orders retrieved successfully!",
          data: defaultData
        });
      }
      
      res.status(200).json({
        success: true,
        message: "Project orders retrieved successfully!",
        data: projectOrders.data
      });
    } catch (error) {
      console.error('Error fetching project orders:', error);
      res.status(500).json({
        success: false,
        message: "Error fetching project orders",
        error: error.message
      });
    }
  };

  // Update project orders
  static updateProjectOrders = async (req, res) => {
    try {
      const { data } = req.body;
      
      if (!data) {
        return res.status(400).json({
          success: false,
          message: "Project order data is required!"
        });
      }

      // Find existing record or create new one
      let projectOrder = await ProjectOrder.findOne();
      
      if (projectOrder) {
        projectOrder.data = data;
        projectOrder.updatedAt = new Date();
      } else {
        projectOrder = new ProjectOrder({ data });
      }
      
      await projectOrder.save();
      
      res.status(200).json({
        success: true,
        message: "Project orders updated successfully!",
        data: projectOrder.data
      });
    } catch (error) {
      console.error('Error updating project orders:', error);
      res.status(500).json({
        success: false,
        message: "Error updating project orders",
        error: error.message
      });
    }
  };

  // Get project order by category
  static getProjectOrderByCategory = async (req, res) => {
    try {
      const { category } = req.params;
      
      const projectOrder = await ProjectOrder.findOne();
      
      if (!projectOrder || !projectOrder.data[category]) {
        return res.status(404).json({
          success: false,
          message: `No project order found for category: ${category}`
        });
      }
      
      res.status(200).json({
        success: true,
        message: `${category} project order retrieved successfully!`,
        data: projectOrder.data[category]
      });
    } catch (error) {
      console.error('Error fetching project order by category:', error);
      res.status(500).json({
        success: false,
        message: "Error fetching project order by category",
        error: error.message
      });
    }
  };
}

module.exports = ProjectOrderController;


