const SmallBanner = require('../../models/SmallBanner');
const { uploadToS3 } = require('../../aws/s3Helper');

class SmallBannerController {
  // Get all small banners (admin)
  static getAllSmallBanners = async (req, res) => {
    try {
      const banners = await SmallBanner.find()
        .sort({ order: 1, createdAt: -1 })
        .populate('uploadedBy', 'name email');
      
      res.status(200).json({
        success: true,
        banners
      });
    } catch (error) {
      console.error('Error fetching small banners:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Get active small banners (public)
  static getActiveSmallBanners = async (req, res) => {
    try {
      const banners = await SmallBanner.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .select('-uploadedBy -__v');
      
      res.status(200).json({
        success: true,
        banners
      });
    } catch (error) {
      console.error('Error fetching active small banners:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Upload new small banner
  static uploadSmallBanner = async (req, res) => {
    try {
      const { title, subtitle, slug, link, isActive, order, position, size, desktopImage, mobileImage } = req.body;

      console.log('Received small banner data:', {
        title,
        subtitle,
        slug,
        link,
        isActive,
        order,
        position,
        size,
        desktopImage,
        mobileImage
      });

      console.log('User info from req.user:', req.user);
      console.log('User ID:', req.user?.id);
      console.log('User _id:', req.user?._id);
      console.log('User userId:', req.user?.userId);

      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Banner title is required'
        });
      }

      // Check if at least one image is provided
      if (!req.files?.desktopBannerImage && !req.files?.mobileBannerImage && !desktopImage && !mobileImage) {
        return res.status(400).json({
          success: false,
          message: 'At least one banner image (desktop or mobile) is required'
        });
      }

      let desktopImageData = null;
      let mobileImageData = null;

      // Handle desktop image
      if (req.files?.desktopBannerImage) {
        desktopImageData = await uploadToS3(req.files.desktopBannerImage[0], 'small-banners');
      } else if (desktopImage) {
        desktopImageData = {
          url: desktopImage,
          cdn_url: desktopImage
        };
      }

      // Handle mobile image
      if (req.files?.mobileBannerImage) {
        mobileImageData = await uploadToS3(req.files.mobileBannerImage[0], 'small-banners');
      } else if (mobileImage) {
        mobileImageData = {
          url: mobileImage,
          cdn_url: mobileImage
        };
      }

      // Handle uploadedBy field - use user ID if available, otherwise use a default
      let uploadedBy = req.user?.id || req.user?._id || req.user?.userId;
      
      // If no user ID is found, try to get the first admin user from the database
      if (!uploadedBy) {
        try {
          const User = require('../../models/register/User');
          const adminUser = await User.findOne({ role: 'Admin' }).select('_id');
          uploadedBy = adminUser?._id || '64f8b8c9e4b0a123456789ab'; // Fallback to default
        } catch (error) {
          console.log('Error finding admin user:', error);
          uploadedBy = '64f8b8c9e4b0a123456789ab'; // Fallback to default
        }
      }
      
      console.log('Using uploadedBy:', uploadedBy);
      
      // Ensure uploadedBy is a valid ObjectId
      if (!uploadedBy || uploadedBy === 'undefined' || uploadedBy === 'null') {
        uploadedBy = '64f8b8c9e4b0a123456789ab'; // Default admin user ID
      }

      const smallBanner = new SmallBanner({
        title,
        subtitle: subtitle || '',
        slug: slug || '',
        link: link || '',
        desktopImage: desktopImageData,
        mobileImage: mobileImageData,
        isActive: isActive === 'true' || isActive === true,
        order: parseInt(order) || 0,
        position: position || 'bottom',
        size: size || 'small',
        uploadedBy: uploadedBy
      });

      await smallBanner.save();

      res.status(201).json({
        success: true,
        message: 'Small banner uploaded successfully',
        banner: smallBanner
      });
    } catch (error) {
      console.error('Error uploading small banner:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error: ' + (error.message || 'Unknown error')
      });
    }
  };

  // Update small banner
  static updateSmallBanner = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, subtitle, slug, link, isActive, order, position, size } = req.body;

      const smallBanner = await SmallBanner.findById(id);
      if (!smallBanner) {
        return res.status(404).json({
          success: false,
          message: 'Small banner not found'
        });
      }

      // Update fields
      if (title) smallBanner.title = title;
      if (subtitle !== undefined) smallBanner.subtitle = subtitle;
      if (link !== undefined) smallBanner.link = link;
      if (isActive !== undefined) smallBanner.isActive = isActive;
      if (order !== undefined) smallBanner.order = parseInt(order);
      if (position !== undefined) smallBanner.position = position;
      if (size !== undefined) smallBanner.size = size;
      
      // Handle slug update with conflict resolution
      if (slug !== undefined && slug !== smallBanner.slug) {
        // Check if slug already exists for another banner
        const existingBanner = await SmallBanner.findOne({ 
          slug: slug, 
          _id: { $ne: id } 
        });
        
        if (existingBanner) {
          // Generate unique slug by appending timestamp
          const timestamp = Date.now().toString().slice(-6);
          smallBanner.slug = `${slug}-${timestamp}`;
        } else {
          smallBanner.slug = slug;
        }
      }

      // Handle new image upload
      if (req.file) {
        const bannerImageData = await uploadToS3(req.file, 'small-banners');
        smallBanner.image = bannerImageData;
      }

      await smallBanner.save();

      res.status(200).json({
        success: true,
        message: 'Small banner updated successfully',
        banner: smallBanner
      });
    } catch (error) {
      console.error('Error updating small banner:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Delete small banner
  static deleteSmallBanner = async (req, res) => {
    try {
      const { id } = req.params;

      const smallBanner = await SmallBanner.findById(id);
      if (!smallBanner) {
        return res.status(404).json({
          success: false,
          message: 'Small banner not found'
        });
      }

      await SmallBanner.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Small banner deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting small banner:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Toggle small banner status
  static toggleSmallBannerStatus = async (req, res) => {
    try {
      const { id } = req.params;

      const smallBanner = await SmallBanner.findById(id);
      if (!smallBanner) {
        return res.status(404).json({
          success: false,
          message: 'Small banner not found'
        });
      }

      smallBanner.isActive = !smallBanner.isActive;
      await smallBanner.save();

      res.status(200).json({
        success: true,
        message: `Small banner ${smallBanner.isActive ? 'activated' : 'deactivated'} successfully`,
        banner: smallBanner
      });
    } catch (error) {
      console.error('Error toggling small banner status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

module.exports = SmallBannerController;
