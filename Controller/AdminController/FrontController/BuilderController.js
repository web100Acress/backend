const { isValidObjectId } = require("mongoose");
const Builder = require("../../../models/builder");
const cache = require("memory-cache");

// POST /builder/Insert - Create new builder
const builderInsert = async (req, res) => {
  try {
    const { builderName, createdAt, status } = req.body;

    // Validation
    if (!builderName || builderName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Builder name is required'
      });
    }

    // Check if builder already exists
    const existingBuilder = await Builder.findOne({ 
      builderName: builderName.trim() 
    });

    if (existingBuilder) {
      return res.status(409).json({
        success: false,
        message: 'Builder with this name already exists'
      });
    }

    // Create new builder
    const newBuilder = new Builder({
      builderName: builderName.trim(),
      createdAt: createdAt || new Date(),
      status: status || 'active'
    });

    await newBuilder.save();

    // Clear cache if you're using caching
    cache.del("builders_list");

    res.status(201).json({
      success: true,
      message: 'Builder created successfully',
      data: {
        id: newBuilder._id,
        builderName: newBuilder.builderName,
        createdAt: newBuilder.createdAt,
        status: newBuilder.status
      }
    });

  } catch (error) {
    console.error('Error creating builder:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({
        success: false,
        message: 'Builder with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /builder/viewAll - Get all builders
const builderViewAll = async (req, res) => {
  try {
    // Check cache first
    const cacheKey = "builders_list";
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: 'Builders retrieved successfully (cached)',
        data: cachedData.data,
        count: cachedData.count
      });
    }

    const builders = await Builder.find({ status: 'active' })
      .sort({ builderName: 1 })
      .select('builderName createdAt status');

    // Cache for 30 minutes
    cache.put(cacheKey, { data: builders, count: builders.length }, 30 * 60 * 1000);

    res.status(200).json({
      success: true,
      message: 'Builders retrieved successfully',
      data: builders,
      count: builders.length
    });

  } catch (error) {
    console.error('Error fetching builders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /builder/view/:id - Get single builder
const builderView = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid builder ID'
      });
    }

    const builder = await Builder.findById(id);

    if (!builder) {
      return res.status(404).json({
        success: false,
        message: 'Builder not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Builder retrieved successfully',
      data: builder
    });

  } catch (error) {
    console.error('Error fetching builder:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// PUT /builder/update/:id - Update builder
const builderUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { builderName, status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid builder ID'
      });
    }

    const updatedBuilder = await Builder.findByIdAndUpdate(
      id,
      { 
        builderName: builderName?.trim(),
        status,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedBuilder) {
      return res.status(404).json({
        success: false,
        message: 'Builder not found'
      });
    }

    // Clear cache
    cache.del("builders_list");

    res.status(200).json({
      success: true,
      message: 'Builder updated successfully',
      data: updatedBuilder
    });

  } catch (error) {
    console.error('Error updating builder:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Builder with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// DELETE /builder/delete/:id - Delete builder (soft delete)
const builderDelete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid builder ID'
      });
    }

    const deletedBuilder = await Builder.findByIdAndUpdate(
      id,
      { status: 'inactive', updatedAt: new Date() },
      { new: true }
    );

    if (!deletedBuilder) {
      return res.status(404).json({
        success: false,
        message: 'Builder not found'
      });
    }

    // Clear cache
    cache.del("builders_list");

    res.status(200).json({
      success: true,
      message: 'Builder deleted successfully',
      data: deletedBuilder
    });

  } catch (error) {
    console.error('Error deleting builder:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  builderInsert,
  builderViewAll,
  builderView,
  builderUpdate,
  builderDelete
};
