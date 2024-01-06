
// const { json } = require('body-parser');
const blogModel = require('../../../models/blog/blogpost');
const postPropertyModel = require('../../../models/postProperty/post');
const cloudinary = require('cloudinary').v2;

class blogController {

    //Blog insert api for data
    static blog_Insert = async (req, res) => {
       //console.log("hello")
        try {
            const { title, descripation } = req.body
            if (title && descripation) {

                const sliderImage = req.files.sliderImage;
                const sliderResult = await cloudinary.uploader.upload(
                    sliderImage.tempFilePath, {
                    folder: `100acre/Blog/${title}`
                }
                )

                const data = new blogModel({
                    sliderImage: {
                        public_id: sliderResult.public_id,
                        url: sliderResult.secure_url,
                    },
                    title: title,
                    descripation: descripation

                })
                //  console.log(data)
                await data.save()
                res.status(200).json({
                    message: "submitted successfully ! "
                })


            } else {
                res.status(204).json({
                    message: "check your field ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: " Internal server error ! "
            })
        }
    }
    // blog data view All
    static blogviewAll = async (req, res) => {
        try {
            // console.log("hello")
            const data = await blogModel.find()
            // res.send(data)
            res.status(200).json({
                message: "Data get succesfull !",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error !"
            })
        }   
    }
    // blog data view one 
    static blog_View = async (req, res) => {
        // res.send("hello")
        try {
            const id = req.params.id
            const data = await blogModel.findById(id)
            res.status(200).json({
                message: "data get successfully ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "something went wrong ! "
            })
        }
    }
    // blog  data edit 
    static blog_Edit = async (req, res) => {
        try {
            // res.send("edit")
            const id = req.params.id
            const data = await blogModel.findById({ _id: id })
            res.status(200).json({
                message: "data get successfully ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong ! "
            })
        }
    }
    // blog data update 
    static blog_Update = async (req, res) => {
        // console.log("hello")
        try {
            const { title, descripation } = req.body
            if (title && descripation) {
                if (req.files) {
                    const sliderImage = req.files.sliderImage;
                    const id = req.params.id
                    const data = await blogModel.findById(id)
                    const sliderId = data.sliderImage.public_id;
                    await cloudinary.uploader.destroy(sliderId)
                    const sliderResult = await cloudinary.uploader.upload(
                        sliderImage.tempFilePath,
                        {  folder:`100acre/blog/${title}`}
                    )

                    const dataUpdate = await blogModel.findByIdAndUpdate(id, {
                        sliderImage: {
                            public_id: sliderResult.public_id,
                            url: sliderResult.secure_url
                        },
                        title: title,
                        descripation: descripation
                    })
                    // console.log(dataUpdate)
                    await dataUpdate.save()
                    res.status(200).json({
                        message: "data updated successfully !  ",
                        dataUpdate
                    })

                } else {
                    const id = req.params.id
                    const dataUpdate = await blogModel.findByIdAndUpdate(id, {

                        title: title,
                        descripation: descripation
                    })
                    // console.log(dataUpdate)
                    await dataUpdate.save()
                    res.status(200).json({
                        message: "data updated successfully !  ",
                        dataUpdate
                    })
                }

            } else {
                res.status(500).json({
                    message: "check your field ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "something went wrong ! "
            })
        }
    }
    // blog data delete 
    static blog_delete = async (req, res) => {
        try {
            //   console.log("delete")
            const id = req.params.id;
            const data = await blogModel.findById(id);
            const sliderId = data.sliderImage.public_id;
            if (sliderId != null) {
                await cloudinary.uploader.destroy(sliderId)
                await blogModel.findByIdAndDelete(id)
                res.status(200).json({
                    message: "data deleted successfully !! "
                })
            } else {
                await blogModel.findByIdAndDelete(id)
                res.status(200).json({
                    message: "data deleted successfully ! "
                })
            }

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong ! "
            })
        }
    }
    // PostBlogs
      // blog post data inert 
    static blogPost_insert = async (req, res) => {
        // console.log("hello")
        try {
            const { title, descripation } = req.body
            if (req.files) {
                const blogimage = req.files.blogImage;
                const blogResult = await cloudinary.uploader.upload(
                    blogimage.tempFilePath, {
                    folder:`100acre/blog/${title}`
                }
                )
                const data = {
                    blogImage: {
                        public_id: blogResult.public_id,
                        url: blogResult.secure_url
                    },
                    title: title,
                    descripation: descripation,
                }
                // console.log(data)
                const id = req.params.id
                const dataPushed = await blogModel.findOneAndUpdate(
                    { _id: id },
                    { $push: { blog: data } },
                    { new: true }
                )
                // console.log(dataPushed)
                await dataPushed.save()
                res.status(200).json({
                    message: "data updated successfully ! "
                })
            } else {
                res.status(204).json({
                    message: "check your field ! "
                })

            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error  ! "
            })
        }
    }
      // blog post data view 
    static blogPost_view = async (req, res) => {
        // console.log("HELLO")
        try {
            // console.log("hello")
            const id = req.params.id
            // console.log(id)
            const blogdata = await blogModel.findOne(
                { "blog._id": id },
                {
                    blog: {
                        $elemMatch: {
                            _id: id
                        }
                    }

                })
            // console.log(blogdata)
            res.status(200).json({
                message: "data get successful ! ",
                blogdata
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong ! "
            })
        }
    }
      // blog post data edit 
    static blogPost_edit = async (req, res) => {
        // console.log("edit")
        try {
            // console.log("hello")
            const id = req.params.id;
            const data = await blogModel.findOne({ "blog._id": id }, {
                blog: {
                    $elemMatch: {
                        _id: id
                    }
                }
            })
            res.status(200).json({
                message: "data get successfull ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong !"
            })
        }
    }
    // blog Post data update 
    static blogPost_update = async (req, res) => {
        // console.log("hello")
        try {
            // console.log("hello")
            const { title, descripation } = req.body
            if (req.files) {
                const blogimage = req.files.blogImage
                // console.log(blogimage)
                const id = req.params.id
                const data = await blogModel.findOne({ "blog._id": id },

                    {
                        blog: {
                            $elemMatch: {
                                _id: id
                            }
                        }
                    }
                )
                console.log(data)
                const blogimageId = data.blog[0].blogImage.public_id;
                // console.log(blogimageId)
                await cloudinary.uploader.destroy(blogimageId)
                const blogimageResult = await cloudinary.uploader.upload(
                    blogimage.tempFilePath,
                    {
                        folder:`100acre/blog/${title}`
                    }
                )
                const dataUpdate = {
                    blogImage: {
                        public_id: blogimageResult.public_id,
                        url: blogController.secure_url
                    },
                    title: title,
                    descripation: descripation
                }
                // console.log(dataUpdate)
                const update = await blogModel.findOneAndUpdate(
                    { "blog._id": id },
                    {
                        $set: {
                            "blog.$": dataUpdate
                        }
                    }
                )
                // console.log(update)
                await update.save()
                res.status(200).json({
                    message: "updated successfully ! "
                })

            } else {
                // console.log("no")
                const id = req.params.id;

                const data = await blogModel.findOne({ "blog._id": id },
                    {
                        blog: {
                            $elemMatch: {
                                _id: id
                            }
                        }
                    })

                // console.log(data)
                const update = {
                    title: title,
                    descripation: descripation
                }
                // console.log(update)
                const dataUpdate = await blogModel.findOneAndUpdate({ "blog._id": id },
                    {
                        $set: {
                            "blog.$": update
                        }
                    })
                // console.log(dataUpdate)
                await dataUpdate.save()
                res.status(200).json({
                    message: "data updated successfully ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong ! "
            })
        }
    }
    // blog post data delete 
    static blogPost_delete = async (req, res) => {
        try {
            // res.send('hello')
            const id = req.params.id
            console.log(id)
            const data = await blogModel.findOne({ "blog._id": id },
                {
                    blog: {
                        $elemMatch: {
                            _id: id
                        }
                    }
                })
            const blogimageId = data.blog[0].blogImage.public_id;

            if (blogimageId !== null) {
                await cloudinary.uploader.destroy(blogimageId)
            }
            const update = {
                $pull: {
                    blog: { _id: id }
                }
            };
            // Perform the update operation
            const result = await blogModel.updateOne(update);
            res.status(200).json({
                message: "delete",
                result
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! "
            })
        }
    }
}
module.exports = blogController

