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

      const desktopFile = req.file || (req.files && req.files.bannerImage && req.files.bannerImage[0]);
      const mobileFile = req.files && req.files.mobileBannerImage && req.files.mobileBannerImage[0];

      if (!desktopFile) {
        return res.status(400).json({
          success: false,
          message: 'Banner image is required'
        });
      }

      // Upload images to S3
      let imageData;
      let mobileImageData;
      
      try {
        // Upload desktop image
        imageData = await uploadFile(desktopFile);
        console.log('✅ Banner image uploaded to S3:', imageData);
        
        // Upload mobile image if provided
        if (mobileFile) {
          // Ensure the mobile file object has all required properties
          const mobileFileToUpload = {
            ...mobileFile,
            originalname: mobileFile.originalname || `mobile-${Date.now()}.jpg`,
            mimetype: mobileFile.mimetype || 'image/jpeg',
            buffer: mobileFile.buffer || Buffer.from(mobileFile.buffer || '')
          };
          
          console.log('Uploading mobile banner file:', {
            originalname: mobileFileToUpload.originalname,
            mimetype: mobileFileToUpload.mimetype,
            hasBuffer: !!mobileFileToUpload.buffer,
            size: mobileFileToUpload.buffer ? mobileFileToUpload.buffer.length : 0
          });
          
          mobileImageData = await uploadFile(mobileFileToUpload);
          console.log('✅ Mobile banner image uploaded to S3:', mobileImageData);
        }
      } catch (s3Error) {
        console.error('❌ S3 upload failed:', s3Error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to S3: ' + (s3Error.message || 'Unknown error'),
          error: process.env.NODE_ENV === 'development' ? s3Error.message : undefined
        });
      }

      // Add CDN URL
      const cloudfrontUrl = "https://d16gdc5rm7f21b.cloudfront.net/";
      const bannerImageData = {
        public_id: imageData.Key,
        url: imageData.Location,
        cdn_url: cloudfrontUrl + imageData.Key
      };
      const mobileBannerImageData = mobileImageData
        ? {
            public_id: mobileImageData.Key,
            url: mobileImageData.Location,
            cdn_url: cloudfrontUrl + mobileImageData.Key
          }
        : undefined;

      // Create banner record
      const banner = new Banner({
        title,
        subtitle: subtitle || '',
        slug: slug || '',
        image: bannerImageData,
        mobileImage: mobileBannerImageData,
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

      console.log('Banner update request:', {
        id,
        title,
        subtitle,
        slug,
        isActive,
        order,
        hasFile: !!req.file
      });

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

      // Determine if files exist (multer single or fields)
      const desktopFile = req.file || (req.files && req.files.bannerImage && req.files.bannerImage[0]);
      const mobileFile = req.files && req.files.mobileBannerImage && req.files.mobileBannerImage[0];

      // Handle new image upload if provided
      if (desktopFile) {
        try {
          const imageData = await uploadFile(desktopFile);
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

      // Handle new mobile image upload if provided
      if (mobileFile) {
        try {
          // Ensure the file object has all required properties
          const mobileFileToUpload = {
            ...mobileFile,
            originalname: mobileFile.originalname || `mobile-${Date.now()}.jpg`,
            mimetype: mobileFile.mimetype || 'image/jpeg',
            buffer: mobileFile.buffer || Buffer.from(mobileFile.buffer || '')
          };
          
          console.log('Uploading mobile file:', {
            originalname: mobileFileToUpload.originalname,
            mimetype: mobileFileToUpload.mimetype,
            hasBuffer: !!mobileFileToUpload.buffer,
            size: mobileFileToUpload.buffer ? mobileFileToUpload.buffer.length : 0
          });
          
          const mobileImageData = await uploadFile(mobileFileToUpload);
          const cloudfrontUrl = "https://d16gdc5rm7f21b.cloudfront.net/";
          
          banner.mobileImage = {
            public_id: mobileImageData.Key,
            url: mobileImageData.Location,
            cdn_url: cloudfrontUrl + mobileImageData.Key
          };
          
          console.log('Mobile image uploaded successfully:', banner.mobileImage);
        } catch (s3Error) {
          console.error('❌ S3 mobile upload failed:', s3Error);
          return res.status(500).json({
            success: false,
            message: `Failed to upload new mobile image to S3: ${s3Error.message}`,
            error: process.env.NODE_ENV === 'development' ? s3Error.message : undefined
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
