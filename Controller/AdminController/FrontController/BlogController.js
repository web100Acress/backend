
const blogModel = require('../../../models/blog/blogpost');
const postPropertyModel = require('../../../models/postProperty/post');
const cloudinary = require('cloudinary').v2;
  const ObjectId = require('mongodb').ObjectId;
  const fs = require("fs");
  const path = require("path");
  const uploadFile = require("../../../aws/s3Helper");
class blogController {

    static blog_insert = async (req, res) => {
        try {
            if (!req.file) {
              return res.status(400).json({ message: 'No image uploaded' });
            }
            const { blog_Title, blog_Description, author, blog_Category } = req.body;
            if (!blog_Title || !blog_Description || !author || !blog_Category) {
              return res.status(400).json({ message: 'Missing fields' });
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
              blog_Description,
              author,
              blog_Category,
            });
            await newBlog.save();
            // Clean up local file
            fs.unlinkSync(req.file.path);
            res.status(200).json({ message: 'Blog inserted successfully', data: newBlog });
          } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
          }
    }

    static blog_view=async(req,res)=>{
       try{
        // res.send("bsdbk.kkjnc cnf")
         const data= await blogModel.find()
         if(data){
            res.status(200).json({
                message:"Data get successfull ! ",
                data
            })
         }else{
            res.status(200).json({
                message:"Data not found ! ",
                data
            })
         }
       }catch(error){
        res.status(500).json({
            message:"Itnernal server error !"
        })
       }
    }

    static blog_viewId = async (req, res) => {
        // console.log("hsbasdjk")
        try {
            const id = req.params.id
            if (ObjectId.isValid(id)) {
                const data = await blogModel.findById({ _id: id })
                res.status(201).json({
                    message: "Data get successfully",
                    data
                })
            } else {
                res.status(404).json({
                    message: "Not found !"
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }

    static blog_edit = async (req, res) => {
        try {
            //    res.send(req.params.id)
            const id = req.params.id
            if (ObjectId.isValid(id)) {
                const data = await blogModel.findById({ _id: id })
                res.status(200).json({
                    message: "Data get successfully ! ",
                    data
                })
            } else {
                res.status(404).json({
                    message: "Not found !"
                })
            }

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error !"
            })
        }
    }

    static blog_update = async (req, res) => {
        // console.log("hellobfiu")
        try {
            const id = req.params.id
            if (ObjectId.isValid(id)) {
                const { blog_Title, blog_Description, author, blog_Category } = req.body
                if (req.files) {
                    const data = await blogModel.findById({ _id: id })
                    const Title = data.blog_Title.trim()
                    const blogImage = req.files.blog_Image
                    const blogResult = await cloudinary.uploader.upload(
                        blogImage.tempFilePath, {
                        folder: `100acre/blog/${Title}`
                    }
                    )
                    const update = await blogModel.findByIdAndUpdate({ _id: id }, {
                        blog_Image: {
                            public_id: blogResult.public_id,
                            url: blogResult.secure_url
                        },
                        blog_Title: blog_Title,
                        blog_Description: blog_Description,
                        author: author,
                        blog_Category: blog_Category
                    })
                    await update.save()
                    res.status(200).json({
                        message: "data updated successfully !"
                    })
                } else {
                    const update = await blogModel.findByIdAndUpdate({ _id: id }, {
                        blog_Title: blog_Title,
                        blog_Description: blog_Description,
                        author: author,
                        blog_Category: blog_Category
                    })
                    await update.save()
                    res.status(200).json({
                        message: "data updated successfully !"
                    })
                }
                
            }else{
                res.status(404).json({
                    message:"not found!"
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error !l̥"
            })
        }
    }
    

    static blog_delete=async(req,res)=>{
        try{
            const id=req.params.id
            if(ObjectId.isValid(id)){
                const data=await blogModel.findById({_id:id})
                const imageId=data.blog_Image.public_id
                if(imageId){
                    await cloudinary.uploader.destroy(imageId)
                }
                await blogModel.findByIdAndDelete({_id:id})
                res.status(200).json({
                    message:"data delete successfully !"
                })
            }else{
                res.status(404).json({
                    message:"not found !"
                })
            }
        }catch(error){
           console.log(error)
           res.status(500).json({
            message:"Internal server error !"
           })
        }
    }
       
}
module.exports = blogController

