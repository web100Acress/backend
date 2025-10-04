const path = require('path');
const Guide = require(path.join(__dirname, '../../models/Insight/Guide'));
const { uploadFile } = require('../../Utilities/s3HelperUtility');

// @desc    Get all guides
// @route   GET /api/guides
// @access  Public
exports.getGuides = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const guides = await Guide.find(query) 
    
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Guide.countDocuments(query);

    res.json({
      success: true,
      count: guides.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: guides
    });
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single guide
// @route   GET /api/guides/:id
// @access  Public
exports.getGuide = async (req, res) => {
  try {
    const guide = await Guide.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!guide) {
      return res.status(404).json({ success: false, message: 'Guide not found' });
    }

    res.json({ success: true, data: guide });
  } catch (error) {
    console.error('Error fetching guide:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create guide
// @route   POST /api/guides
// @access  Private/Admin
exports.createGuide = async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    // Upload file to S3 using the helper utility
    const uploadResult = await uploadFile(file);

    const guideData = {
      ...req.body,
      fileUrl: uploadResult.Location,
      fileKey: uploadResult.Key,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      createdBy: req.user.id
    };

    // Convert tags from string to array if it's a string
    if (typeof guideData.tags === 'string') {
      guideData.tags = guideData.tags.split(',').map(tag => tag.trim());
    }

    const guide = await Guide.create(guideData);
    
    res.status(201).json({ success: true, data: guide });
  } catch (error) {
    console.error('Error creating guide:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update guide
// @route   PUT /api/guides/:id
// @access  Private/Admin
exports.updateGuide = async (req, res) => {
  try {
    let updateData = { ...req.body };
    
    if (req.file) {
      // Upload new file to S3 using the helper utility
      const uploadResult = await uploadFile(req.file);
      updateData = {
        ...updateData,
        fileUrl: uploadResult.Location,
        fileKey: uploadResult.Key,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      };
    }

    // Convert tags from string to array if it's a string
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }

    const guide = await Guide.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!guide) {
      return res.status(404).json({ success: false, message: 'Guide not found' });
    }

    res.json({ success: true, data: guide });
  } catch (error) {
    console.error('Error updating guide:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete guide
// @route   DELETE /api/guides/:id
// @access  Private/Admin
exports.deleteGuide = async (req, res) => {
  try {
    const guide = await Guide.findByIdAndDelete(req.params.id);

    if (!guide) {
      return res.status(404).json({ success: false, message: 'Guide not found' });
    }

    // Delete file from S3 if it exists
    if (guide.fileKey) {
      try {
        const { deleteFile } = require('../../Utilities/s3HelperUtility');
        await deleteFile(guide.fileKey);
      } catch (error) {
        console.error('Error deleting file from S3:', error);
        // Continue with guide deletion even if file deletion fails
      }
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting guide:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get guides by category
// @route   GET /api/guides/category/:category
// @access  Public
exports.getGuidesByCategory = async (req, res) => {
  try {
    const guides = await Guide.find({ category: req.params.category })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: guides.length, data: guides });
  } catch (error) {
    console.error('Error fetching guides by category:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get featured guides
// @route   GET /api/guides/featured
// @access  Public
exports.getFeaturedGuides = async (req, res) => {
  try {
    const guides = await Guide.find({ isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    res.json({ success: true, count: guides.length, data: guides });
  } catch (error) {
    console.error('Error fetching featured guides:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
