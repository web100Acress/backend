const SideBanner = require('../../models/SideBanner');
const { uploadFile } = require('../../Utilities/s3HelperUtility');

class SideBannerController {
  static getAllSideBanners = async (req, res) => {
    try {
      const sideBanners = await SideBanner.find()
        .sort({ order: 1, createdAt: -1 })
        .populate('uploadedBy', 'name email');

      res.status(200).json({
        success: true,
        sideBanners
      });
    } catch (error) {
      console.error('Error fetching side banners:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  static getActiveSideBanners = async (req, res) => {
    try {
      const sideBanners = await SideBanner.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .select('-uploadedBy -__v');

      res.status(200).json({
        success: true,
        sideBanners
      });
    } catch (error) {
      console.error('Error fetching active side banners:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  static getSideBannerById = async (req, res) => {
    try {
      const { id } = req.params;

      const sideBanner = await SideBanner.findById(id);
      if (!sideBanner) {
        return res.status(404).json({
          success: false,
          message: 'Side banner not found'
        });
      }

      res.status(200).json({
        success: true,
        sideBanner
      });
    } catch (error) {
      console.error('Error fetching side banner:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  static uploadSideBanner = async (req, res) => {
    try {
      const { title, subtitle, slug, link, isActive, order, position, showOnScroll, scrollOffset, height } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Side banner title is required'
        });
      }

      const bannerFile = req.file || (req.files && req.files.bannerImage && req.files.bannerImage[0]);
      if (!bannerFile) {
        return res.status(400).json({
          success: false,
          message: 'Side banner image is required'
        });
      }

      let imageData;
      try {
        imageData = await uploadFile(bannerFile);
      } catch (s3Error) {
        console.error('❌ S3 upload failed:', s3Error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to S3: ' + (s3Error.message || 'Unknown error'),
          error: process.env.NODE_ENV === 'development' ? s3Error.message : undefined
        });
      }

      const cloudfrontUrl = 'https://d16gdc5rm7f21b.cloudfront.net/';
      const sideBannerImageData = {
        public_id: imageData.Key,
        url: imageData.Location,
        cdn_url: cloudfrontUrl + imageData.Key
      };

      const sideBanner = new SideBanner({
        title,
        subtitle: subtitle || '',
        slug: slug || '',
        link: link || '',
        image: sideBannerImageData,
        isActive: isActive === 'true' || isActive === true,
        order: parseInt(order) || 0,
        position: position || 'right',
        visibilitySettings: {
          showOnScroll: showOnScroll === undefined ? true : (showOnScroll === 'true' || showOnScroll === true),
          scrollOffset: parseInt(scrollOffset) || 96,
          height: height || 'calc(100vh - 120px)'
        },
        uploadedBy: req.user.id
      });

      await sideBanner.save();

      res.status(201).json({
        success: true,
        message: 'Side banner uploaded successfully',
        sideBanner
      });
    } catch (error) {
      console.error('Error uploading side banner:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error: ' + (error.message || 'Unknown error')
      });
    }
  };

  static updateSideBanner = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, subtitle, slug, link, isActive, order, position, showOnScroll, scrollOffset, height } = req.body;

      const sideBanner = await SideBanner.findById(id);
      if (!sideBanner) {
        return res.status(404).json({
          success: false,
          message: 'Side banner not found'
        });
      }

      if (title) sideBanner.title = title;
      if (subtitle !== undefined) sideBanner.subtitle = subtitle;
      if (slug !== undefined) sideBanner.slug = slug;
      if (link !== undefined) sideBanner.link = link;
      if (isActive !== undefined) sideBanner.isActive = isActive === 'true' || isActive === true;
      if (order !== undefined) sideBanner.order = parseInt(order) || 0;
      if (position !== undefined) sideBanner.position = position;

      if (showOnScroll !== undefined || scrollOffset !== undefined || height !== undefined) {
        sideBanner.visibilitySettings = {
          showOnScroll: showOnScroll === undefined ? sideBanner.visibilitySettings?.showOnScroll : (showOnScroll === 'true' || showOnScroll === true),
          scrollOffset: scrollOffset === undefined ? sideBanner.visibilitySettings?.scrollOffset : (parseInt(scrollOffset) || 96),
          height: height === undefined ? (sideBanner.visibilitySettings?.height || 'calc(100vh - 120px)') : height
        };
      }

      const bannerFile = req.file || (req.files && req.files.bannerImage && req.files.bannerImage[0]);
      if (bannerFile) {
        try {
          const imageData = await uploadFile(bannerFile);
          const cloudfrontUrl = 'https://d16gdc5rm7f21b.cloudfront.net/';
          sideBanner.image = {
            public_id: imageData.Key,
            url: imageData.Location,
            cdn_url: cloudfrontUrl + imageData.Key
          };
        } catch (s3Error) {
          console.error('❌ S3 upload failed:', s3Error);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload new image to S3: ' + (s3Error.message || 'Unknown error')
          });
        }
      }

      await sideBanner.save();

      res.status(200).json({
        success: true,
        message: 'Side banner updated successfully',
        sideBanner
      });
    } catch (error) {
      console.error('Error updating side banner:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  static toggleSideBannerStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const sideBanner = await SideBanner.findById(id);
      if (!sideBanner) {
        return res.status(404).json({
          success: false,
          message: 'Side banner not found'
        });
      }

      sideBanner.isActive = isActive === 'true' || isActive === true;
      await sideBanner.save();

      res.status(200).json({
        success: true,
        message: `Side banner ${sideBanner.isActive ? 'activated' : 'deactivated'} successfully`,
        sideBanner
      });
    } catch (error) {
      console.error('Error toggling side banner status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  static deleteSideBanner = async (req, res) => {
    try {
      const { id } = req.params;

      const sideBanner = await SideBanner.findById(id);
      if (!sideBanner) {
        return res.status(404).json({
          success: false,
          message: 'Side banner not found'
        });
      }

      await SideBanner.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Side banner deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting side banner:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

module.exports = SideBannerController;
