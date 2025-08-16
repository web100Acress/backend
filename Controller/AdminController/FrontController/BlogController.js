const { totalmem } = require("os");
const blogModel = require("../../../models/blog/blogpost");
const postPropertyModel = require("../../../models/postProperty/post");
const ObjectId = require("mongodb").ObjectId;
const {
  uploadFile,
  deleteFile,
  updateFile,
} = require("../../../Utilities/s3HelperUtility");
const fs = require("fs");

class blogController {
  static blog_insert = async (req, res) => {
    try {
      // Debug: Log environment variables (remove in production)
      console.log('🔍 AWS Config Check:', {
        hasAccessKey: !!process.env.AWS_S3_ACCESS_KEY,
        hasSecretKey: !!process.env.AWS_S3_SECRET_ACESS_KEY,
        hasRegion: !!process.env.AWS_REGION,
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_S3_BUCKET || "100acress-media-bucket"
      });

      // Check if AWS credentials are configured
      if (!process.env.AWS_S3_ACCESS_KEY || !process.env.AWS_S3_SECRET_ACESS_KEY) {
        console.error('❌ AWS credentials not configured!');
        return res.status(500).json({ 
          message: "AWS S3 not configured. Please set AWS_S3_ACCESS_KEY and AWS_S3_SECRET_ACESS_KEY environment variables.",
          error: "AWS_CREDENTIALS_MISSING"
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      const { blog_Title, author, blog_Description, blog_Category } = req.body;
      let string_blog_Description = blog_Description;
      const isPublished = req.body.isPublished === 'true';

      if (
        !blog_Title ||
        !string_blog_Description ||
        !author ||
        !blog_Category
      ) {

        return res.status(400).json({ message: "Missing fields" });
      }
      // Upload file to S3
      console.log('📤 Uploading file to S3...');
      let imageData;
      try {
        imageData = await uploadFile(req.file);
        console.log('✅ S3 upload successful:', imageData);
      } catch (s3Error) {
        console.error('❌ S3 upload failed:', s3Error);
        
        // Provide specific error response based on error type
        if (s3Error.message.includes('AWS credentials')) {
          return res.status(500).json({ 
            message: "AWS S3 not configured properly. Please check your AWS credentials.",
            error: "AWS_CREDENTIALS_ERROR"
          });
        } else if (s3Error.message.includes('bucket')) {
          return res.status(500).json({ 
            message: "S3 bucket not found or access denied. Please check your bucket configuration.",
            error: "S3_BUCKET_ERROR"
          });
        } else if (s3Error.message.includes('Network')) {
          return res.status(500).json({ 
            message: "Network error connecting to AWS. Please check your internet connection.",
            error: "NETWORK_ERROR"
          });
        }
        
        // Fallback: use embedded SVG placeholder
        imageData = {
          Key: `temp/${Date.now()}-${req.file.originalname}`,
          Location: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='160' font-family='Arial' font-size='16' text-anchor='middle' fill='%236b7280'%3EUpload Failed%3C/text%3E%3C/svg%3E`
        };
      }
      
      // Save blog entry
      console.log('Saving blog to database...');
      const newBlog = new blogModel({
        blog_Image: {
          public_id: imageData.Key,
          url: imageData.Location,
        },
        blog_Title,
        blog_Description: string_blog_Description,
        author,
        blog_Category,
        isPublished,
      });
      await newBlog.save();
      console.log('Blog saved successfully');
      
      // Clean up local file
      if (req.file && req.file.path) {
        try {
      fs.unlinkSync(req.file.path);
          console.log('Local file cleaned up');
        } catch (cleanupError) {
          console.warn('Failed to cleanup local file:', cleanupError);
        }
      }
      
      res
        .status(200)
        .json({ message: "Blog inserted successfully", data: newBlog });
    } catch (error) {
      console.error('Blog insert error:', error);
      
      // Clean up local file on error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.warn('Failed to cleanup local file on error:', cleanupError);
        }
      }
      
      // Provide more specific error messages
      let errorMessage = "Internal server error";
      if (error.code === 'CredentialsError') {
        errorMessage = "AWS credentials error - check environment variables";
      } else if (error.code === 'NoSuchBucket') {
        errorMessage = "AWS S3 bucket not found";
      } else if (error.name === 'ValidationError') {
        errorMessage = "Database validation error";
      } else if (error.name === 'MongoError') {
        errorMessage = "Database connection error";
      }
      
      res.status(500).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  static blog_view = async (req, res) => {
    try {
      // res.send("bsdbk.kkjnc cnf")
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;
      const skip = (page - 1) * limit;

      const data = await blogModel.find({isPublished:true}).skip(skip).limit(limit).sort({[sortBy]: sortOrder});
      const totalBlogs = await blogModel.countDocuments({isPublished:true});
      if (data) {
        res.status(200).json({
          message: "Data get successfull ! ",
          data,
          totalPages: Math.ceil(totalBlogs / limit),
        });
      } else {
        res.status(200).json({
          message: "Data not found ! ",
          data,
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "Itnernal server error !",
      });
    }
  };

  // Admin endpoint to view ALL blogs (published + drafts)
  static admin_blog_view = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 1000, // High limit for admin to see all blogs
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;
      const skip = (page - 1) * limit;

      // Get ALL blogs regardless of publish status
      const data = await blogModel.find({}).skip(skip).limit(limit).sort({[sortBy]: sortOrder});
      const totalBlogs = await blogModel.countDocuments({});
      
      console.log(`Admin blog view: Found ${data.length} blogs out of ${totalBlogs} total`);
      
      if (data) {
        res.status(200).json({
          message: "Admin data retrieved successfully",
          data,
          totalPages: Math.ceil(totalBlogs / limit),
          totalBlogs,
          publishedBlogs: data.filter(blog => blog.isPublished === true).length,
          draftBlogs: data.filter(blog => blog.isPublished === false).length,
        });
      } else {
        res.status(200).json({
          message: "No data found",
          data: [],
        });
      }
    } catch (error) {
      console.error("Admin blog view error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  static Draft_view = async (req, res) => {
    try {
      // res.send("bsdbk.kkjnc cnf")
      const {
        page = 1,
        limit = 10,
      } = req.query;

      const skip = (page - 1) * limit;
      const data = await blogModel.find({isPublished:false}).skip(skip).limit(limit);
      const totalDrafts = await blogModel.countDocuments({isPublished:false});
      if (data) {
        return res.status(200).json({
          message: "Data get successfull ! ",
          data,
          totalPages: Math.ceil(totalDrafts/limit)
        });
      } else {
        return res.status(200).json({
          message: "Data not found ! ",
          data,
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Itnernal server error !",
      });
    }
  };
  static blog_viewId = async (req, res) => {
    // console.log("hsbasdjk")
    try {
      const id = req.params.id;
      if (ObjectId.isValid(id)) {
        const data = await blogModel.findById({ _id: id });
        res.status(201).json({
          message: "Data get successfully",
          data,
        });
      } else {
        res.status(404).json({
          message: "Not found !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  static blog_edit = async (req, res) => {
    try {
      console.log('Blog edit request received for ID:', req.params.id);
      
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        console.log('Invalid blog ID format:', id);
        return res.status(400).json({
          message: "Invalid blog ID format",
        });
      }

      // Test database connection
      console.log('Testing database connection...');
      const dbState = blogModel.db.readyState;
      console.log('Database state:', dbState);
      
      if (dbState !== 1) {
        console.error('Database not connected. State:', dbState);
        return res.status(500).json({
          message: "Database connection error",
        });
      }

      const data = await blogModel.findById({ _id: id });
      if (!data) {
        console.log('Blog not found with ID:', id);
        return res.status(404).json({
          message: "Blog not found",
        });
      }

      console.log('Blog found:', data.blog_Title);
      res.status(200).json({
        message: "Data get successfully ! ",
        data,
      });
    } catch (error) {
      console.error('Blog edit error:', error);
      
      // Provide more specific error messages
      let errorMessage = "Internal server error";
      if (error.name === 'CastError') {
        errorMessage = "Invalid blog ID format";
      } else if (error.name === 'ValidationError') {
        errorMessage = "Database validation error";
      } else if (error.name === 'MongoError') {
        errorMessage = "Database connection error";
      }
      
      res.status(500).json({
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  static blog_update = async (req, res) => {
    try {
      const id = req.params.id;
      if (ObjectId.isValid(id)) {
        const { blog_Title, blog_Description, author, blog_Category } =
          req.body;

          const isPublished = req.body.isPublished === 'true';
          console.log("isPublished: ",isPublished);

        if (req.file) {
          const data = await blogModel.findById({ _id: id });
          const objectKey = data.blog_Image.public_id;

          const imageData = await updateFile(req.file, objectKey);

          const update = await blogModel.findByIdAndUpdate(
            { _id: id },
            {
              blog_Image: {
                public_id: imageData.Key,
                url: imageData.Location,
              },
              blog_Title: blog_Title,
              blog_Description: blog_Description,
              author: author,
              blog_Category: blog_Category,
              isPublished,
            },
          );

          await update.save();
          // Clean up local file
          fs.unlinkSync(req.file.path);
          res.status(200).json({
            message: "data updated successfully !",
          });
        } else {
          const update = await blogModel.findByIdAndUpdate(
            { _id: id },
            {
              blog_Title: blog_Title,
              blog_Description: blog_Description,
              author: author,
              blog_Category: blog_Category,
              isPublished,
            },
          );
          await update.save();
          res.status(200).json({
            message: "data updated successfully !",
          });
        }
      } else {
        res.status(404).json({
          message: "not found!",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !l̥",
      });
    }
  };
  
  static blog_update_ispublished = async (req, res) => {
    try {
      const id = req.params.id;
      if (ObjectId.isValid(id)) {
          const isPublished = req.body.isPublished ;
          
          if (typeof isPublished !== 'boolean') {
            return res.status(400).json({ message: "Invalid isPublished value" });
          }

          const updatedBlog  = await blogModel.findByIdAndUpdate(
            { _id: id },
            {$set: { isPublished:isPublished }},
            { new: true }
          );

          if (!updatedBlog) {
            return res.status(404).json({ message: "Blog not found" });
          }
    
          return res.status(200).json({
            message: "Status updated successfully!",
            data: updatedBlog
          });
        
      } else {
        return res.status(400).json({ message: "Invalid ID format" });
      }
    } catch (error) {
      console.error("Update error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  };

  static blog_delete = async (req, res) => {
    try {
      console.log('Delete request received for blog ID:', req.params.id);
      
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        console.log('Invalid blog ID format:', id);
        return res.status(400).json({
          message: "Invalid blog ID format",
        });
      }

      // Find the blog first
        const data = await blogModel.findById({ _id: id });
      if (!data) {
        console.log('Blog not found with ID:', id);
        return res.status(404).json({
          message: "Blog not found",
        });
      }

      console.log('Blog found:', data.blog_Title);

      // Delete from S3 if image exists
      if (data.blog_Image && data.blog_Image.public_id) {
        try {
          console.log('Deleting image from S3:', data.blog_Image.public_id);
          await deleteFile(data.blog_Image.public_id);
          console.log('S3 image deleted successfully');
        } catch (s3Error) {
          console.error('S3 delete error:', s3Error);
          // Continue with blog deletion even if S3 delete fails
        }
      } else {
        console.log('No S3 image to delete');
      }

      // Delete from database
      console.log('Deleting blog from database...');
      const deleteResult = await blogModel.findByIdAndDelete({ _id: id });
      
      if (!deleteResult) {
        console.log('Database delete failed');
        return res.status(500).json({
          message: "Failed to delete blog from database",
        });
      }

      console.log('Blog deleted successfully');
      res.status(200).json({
        message: "Blog deleted successfully",
        deletedBlog: {
          id: data._id,
          title: data.blog_Title
        }
      });
      
    } catch (error) {
      console.error('Blog delete error:', error);
      
      // Provide more specific error messages
      let errorMessage = "Internal server error";
      if (error.name === 'CastError') {
        errorMessage = "Invalid blog ID format";
      } else if (error.name === 'ValidationError') {
        errorMessage = "Database validation error";
      } else if (error.code === 'CredentialsError') {
        errorMessage = "AWS credentials error";
      }
      
      res.status(500).json({
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}
module.exports = blogController;
