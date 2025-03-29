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
      const imageData = await uploadFile(req.file);
      // Save blog entry
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
      // Clean up local file
      fs.unlinkSync(req.file.path);
      res
        .status(200)
        .json({ message: "Blog inserted successfully", data: newBlog });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  static blog_view = async (req, res) => {
    try {
      // res.send("bsdbk.kkjnc cnf")
      const {
        page = 1,
        limit = 10,
      } = req.query;
      const skip = (page - 1) * limit;

      const data = await blogModel.find({isPublished:true}).skip(skip).limit(limit);
      const totalBlogs = await blogModel.countDocuments({isPublished:true});
      if (data) {
        res.status(200).json({
          message: "Data get successfull ! ",
          data,
          totalPages: Math.floor(totalBlogs / limit),
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
          totalPages: Math.floor(totalDrafts/limit)
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
      //    res.send(req.params.id)
      const id = req.params.id;
      if (ObjectId.isValid(id)) {
        const data = await blogModel.findById({ _id: id });
        res.status(200).json({
          message: "Data get successfully ! ",
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
        message: "Internal server error !",
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

          const imageData = await upda(req.file, objectKey);

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
      const id = req.params.id;
      if (ObjectId.isValid(id)) {
        const data = await blogModel.findById({ _id: id });
        const imageId = data.blog_Image.public_id;
        if (imageId) {
          await deleteFile(imageId);
        }
        await blogModel.findByIdAndDelete({ _id: id });
        res.status(200).json({
          message: "data delete successfully !",
        });
      } else {
        res.status(404).json({
          message: "not found !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
}
module.exports = blogController;
