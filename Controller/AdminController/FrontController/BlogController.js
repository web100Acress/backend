
const blogModel = require('../../../models/blog/blogpost');
const postPropertyModel = require('../../../models/postProperty/post');
const cloudinary = require('cloudinary').v2;

class blogController {

    static blog_insert = async (req, res) => {
        // console.log("hello")
        // res.send("listen blog")
        try {
            const { blog_Title, blog_Description, author, blog_Category } = req.body

            //    const title=blog_Title.trim()
            const Title = blog_Title.trim();
            const BlogImage = req.files.blog_Image;
            if (!BlogImage) {
                return res.status(400).json({ message: "No file uploaded" });
            }
            const blogResult = await cloudinary.uploader.upload(
                BlogImage.tempFilePath, {
                folder: `100acre/blog/${Title}`
            }
            )
            if (blog_Title && blog_Description && author && blog_Category) {
                const data = new blogModel({
                    blog_Image: {
                        public_id: blogResult.public_id,
                        url: blogResult.secure_url
                    },
                    blog_Title: blog_Title.trim(),
                    blog_Description,
                    author,
                    blog_Category
                })
                await data.save()
                res.status(200).json({
                    message: "Data Inserted successfully !"
                })
            }else{
                return res.status(400).json({ message: "field empty " }); 
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error !"
            })
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

    static blog_viewId=async(req,res)=>{
        // console.log("hsbasdjk")
        const id=req.params.id
        if(id){
          const data=await blogModel.findById(_id.toString===id)
          res.send(data)
        }
    }
    
}
module.exports = blogController

