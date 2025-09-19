const Banner = require('../../models/Banner');
const { uploadFile } = require('../../Utilities/s3HelperUtility');

class BannerController {
  // Get all banners (admin view)
  static getAllBanners = async (req, res) => {
    try {
      const banners = await Banner.find()
        .sort({ order: 1, createdAt: -1 })
        .populate('uploadedBy', 'name email');
      
      res.status(200).json({
        success: true,
        banners
      });
    } catch (error) {
      console.error('Error fetching banners:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Get active banners (public view)
  static getActiveBanners = async (req, res) => {
    try {
      const banners = await Banner.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .select('-uploadedBy -__v');
      
      res.status(200).json({
        success: true,
        banners
      });
    } catch (error) {
      console.error('Error fetching active banners:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Upload new banner
  static uploadBanner = async (req, res) => {
    try {
      const { title, subtitle, slug, isActive, order } = req.body;
      
      // Debug log to see what's being received
      console.log('Received banner data:', {
        title,
        subtitle,
        slug,
        isActive,
        order
      });
      
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Banner title is required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Banner image is required'
        });
      }

      // Upload image to S3
      let imageData;
      try {
        imageData = await uploadFile(req.file);
        console.log('✅ Banner image uploaded to S3:', imageData);
      } catch (s3Error) {
        console.error('❌ S3 upload failed:', s3Error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to S3: ' + (s3Error.message || 'Unknown error')
        });
      }

      // Add CDN URL
      const cloudfrontUrl = "https://d16gdc5rm7f21b.cloudfront.net/";
      const bannerImageData = {
        public_id: imageData.Key,
        url: imageData.Location,
        cdn_url: cloudfrontUrl + imageData.Key
      };

      // Create banner record
      const banner = new Banner({
        title,
        subtitle: subtitle || '',
        slug: slug || '',
        image: bannerImageData,
        isActive: isActive === 'true' || isActive === true,
        order: parseInt(order) || 0,
        uploadedBy: req.user.id
      });

      await banner.save();

      res.status(201).json({
        success: true,
        message: 'Banner uploaded successfully',
        banner
      });

    } catch (error) {
      console.error('Error uploading banner:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error: ' + (error.message || 'Unknown error')
      });
    }
  };

  // Update banner
  static updateBanner = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, subtitle, slug, isActive, order } = req.body;

      const banner = await Banner.findById(id);
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found'
        });
      }

      // Update fields
      if (title) banner.title = title;
      if (subtitle !== undefined) banner.subtitle = subtitle;
      if (slug !== undefined) banner.slug = slug;
      if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;
      if (order !== undefined) banner.order = parseInt(order) || 0;

      // Handle new image upload if provided
      if (req.file) {
        try {
          const imageData = await uploadFile(req.file);
          const cloudfrontUrl = "https://d16gdc5rm7f21b.cloudfront.net/";
          
          banner.image = {
            public_id: imageData.Key,
            url: imageData.Location,
            cdn_url: cloudfrontUrl + imageData.Key
          };
        } catch (s3Error) {
          console.error('❌ S3 upload failed:', s3Error);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload new image to S3'
          });
        }
      }

      await banner.save();

      res.status(200).json({
        success: true,
        message: 'Banner updated successfully',
        banner
      });

    } catch (error) {
      console.error('Error updating banner:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Toggle banner active status
  static toggleBannerStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const banner = await Banner.findById(id);
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found'
        });
      }

      banner.isActive = isActive === 'true' || isActive === true;
      await banner.save();

      res.status(200).json({
        success: true,
        message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
        banner
      });

    } catch (error) {
      console.error('Error toggling banner status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Delete banner
  static deleteBanner = async (req, res) => {
    try {
      const { id } = req.params;

      const banner = await Banner.findById(id);
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found'
        });
      }

      // TODO: Optionally delete image from S3
      // For now, we'll just delete the database record
      
      await Banner.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Banner deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting banner:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Get single banner by ID
  static getBannerById = async (req, res) => {
    try {
      const { id } = req.params;

      const banner = await Banner.findById(id);
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found'
        });
      }

      res.status(200).json({
        success: true,
        banner
      });

    } catch (error) {
      console.error('Error fetching banner:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

module.exports = BannerController;

