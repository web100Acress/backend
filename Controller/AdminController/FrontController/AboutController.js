const aboutModel = require('../../../models/about/about');
const testimonialModel = require('../../../models/about/testimonial');
// const { findById } = require('../../../models/contact');
const rent_Model = require('../../../models/property/rent');

const cloudinary = require('cloudinary').v2;
class aboutController {
    static about = async (req, res) => {
        res.send("about page listen")
    }

    static aboutInsert = async (req, res) => {
        try {
            const { sliderHeading, sliderDescripation, aboutHeading, aboutDescripation, chooseHeading, chooseDescripation } = req.body
            if (sliderHeading && sliderDescripation && aboutHeading && aboutDescripation && chooseHeading && chooseDescripation) {
                if (req.files.sliderImage && req.files.aboutImage && req.files.chooseImage) {
                    const sliderImage = req.files.sliderImage;
                    const aboutImage = req.files.aboutImage;
                    const chooseImage = req.files.chooseImage

                    const sliderResult = await cloudinary.uploader.upload(sliderImage.tempFilePath, {
                        folder: "100acre/aboutPage"
                    })
                    const aboutResult = await cloudinary.uploader.upload(aboutImage.tempFilePath, {
                        folder: "100acre/aboutPage"
                    })
                    const chooseResult = await cloudinary.uploader.upload(chooseImage.tempFilePath, {
                        folder: "100acre/aboutPage"
                    })

                    const data = new aboutModel({
                        sliderImage: {
                            public_id: sliderResult.public_id,
                            url: sliderResult.secure_url
                        },
                        aboutImage: {
                            public_id: aboutResult.public_id,
                            url: aboutResult.secure_url
                        },
                        chooseImage: {
                            public_id: chooseResult.public_id,
                            url: chooseResult.secure_url
                        },
                        sliderHeading: sliderHeading,
                        sliderDescripation: sliderDescripation,
                        aboutHeading: aboutHeading,
                        aboutDescripation: aboutDescripation,
                        chooseHeading: chooseHeading,
                        chooseDescripation: chooseDescripation
                    })
                    //   console.log(data)
                    await data.save()
                    res.status(200).json({
                        message: "data insert successfully !"
                    })

                } else {
                    res.status(500).json({
                        message: "something went wrong !!",
                    })
                }
            } else {
                res.status(500).json({
                    message: "something went wrong !",
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "somthing went wrong !",
                error
            })

        }
    }

    static aboutView = async (req, res) => {
        // res.send("hello")
        try {
            // const id = req.params.id;
            const data = await aboutModel.findById(req.params.id)
            res.status(200).json({
                message: "data get succefully !",
                data
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong ! "
            })
        }
    }
    static aboutViewAll= async(req,res)=>{
        // console.log("hello")
        try {
            // console.log("hello abot")
            const data =await aboutModel.find()
            // res.send(data)
            res.status(200).json({
                message:"data get successfully ! ",
                data
            })
        } catch (error) {
          console.log(error)
          res.status(500).json({
            message:"internal server error ! "
          })  
        }
    }

    static aboutEdit = async (req, res) => {
        // res.send("hello edit")
        try {
            const id = req.params.id;
            const data = await aboutModel.findById({_id:id})
            res.status(200).json({
                message: "data edit !",
                data
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong !",
            })
        }
    }
    static aboutUpdate = async (req, res) => {
        // res.send("hello update")
        try {
            const { sliderHeading, sliderDescripation, aboutHeading, aboutDescripation, chooseHeading, chooseDescripation } = req.body
            if (sliderHeading && sliderDescripation && aboutHeading && aboutDescripation && chooseDescripation && chooseHeading) {
                if (req.files) {
                    if (req.files.sliderImage && req.files.aboutImage && req.files.chooseImage) {

                        const sliderImage = req.files.sliderImage;
                        const aboutImage = req.files.aboutImage;
                        const chooseImage = req.files.chooseImage;

                        const data = await aboutModel.findById(req.params.id)

                        const sliderId = data.sliderImage.public_id
                        await cloudinary.uploader.destroy(sliderId)

                        const aboutId = data.aboutImage.public_id
                        await cloudinary.uploader.destroy(aboutId)

                        const chooseId = data.chooseImage.public_id
                        await cloudinary.uploader.destroy(chooseId)

                        const sliderResult = await cloudinary.uploader.upload(sliderImage.tempFilePath,
                            {
                                folder: "100acre/aboutPage"
                            })

                        const aboutResult = await cloudinary.uploader.upload(aboutImage.tempFilePath, {
                            folder: "100acre/aboutPage"
                        })

                        const chooseResult = await cloudinary.uploader.upload(chooseImage.tempFilePath, {
                            folder: "100acre/aboutPage"
                        })

                        const dataUpdate = await aboutModel.findById(req.params.id, {
                            sliderImage: {
                                public_id: sliderResult.public_id,
                                url: sliderResult.secure_url
                            },
                            aboutImage: {
                                public_id: aboutResult.public_id,
                                url: aboutResult.secure_url
                            },
                            chooseImage: {
                                public_id: chooseResult.public_id,
                                url: chooseResult.secure_url
                            },

                            sliderHeading: sliderHeading,
                            sliderDescripation: sliderDescripation,
                            aboutHeading: aboutHeading,
                            aboutDescripation: aboutDescripation,
                            chooseHeading: chooseHeading,
                            chooseDescripation: chooseDescripation
                        })
                        //    console.log(dataUpdate)
                        await dataUpdate.save()
                        res.status(200).json({
                            message: "updated successfully !",
                            dataUpdate
                        })

                    } else if (req.files.sliderImage) {

                        const sliderImage = req.files.sliderImage;

                        const data = await aboutModel.findById(req.params.id)

                        const sliderId = data.sliderImage.public_id
                        await cloudinary.uploader.destroy(sliderId)

                        const sliderResult = await cloudinary.uploader.upload(sliderImage.tempFilePath,
                            {
                                folder: "100acre/aboutPage"
                            })
                        const dataUpdate = await aboutModel.findById(req.params.id, {
                            sliderImage: {
                                public_id: sliderResult.public_id,
                                url: sliderResult.secure_url
                            },
                            sliderHeading: sliderHeading,
                            sliderDescripation: sliderDescripation,
                            aboutHeading: aboutHeading,
                            aboutDescripation: aboutDescripation,
                            chooseHeading: chooseHeading,
                            chooseDescripation: chooseDescripation
                        })
                        //    console.log(dataUpdate)
                        await dataUpdate.save()
                        res.status(200).json({
                            message: "updated successfully !",
                            dataUpdate
                        })


                    } else if (req.files.aboutImage) {

                        const aboutImage = req.files.aboutImage;

                        const data = await aboutModel.findById(req.params.id)

                        const aboutId = data.aboutImage.public_id
                        await cloudinary.uploader.destroy(aboutId)

                        const aboutResult = await cloudinary.uploader.upload(aboutImage.tempFilePath,
                            {
                                folder: "100acre/aboutPage"
                            })
                        const dataUpdate = await aboutModel.findById(req.params.id, {
                            aboutImage: {
                                public_id: aboutResult.public_id,
                                url: aboutResult.secure_url
                            },
                            sliderHeading: sliderHeading,
                            sliderDescripation: sliderDescripation,
                            aboutHeading: aboutHeading,
                            aboutDescripation: aboutDescripation,
                            chooseHeading: chooseHeading,
                            chooseDescripation: chooseDescripation
                        })
                        //    console.log(dataUpdate)
                        await dataUpdate.save()
                        res.status(200).json({
                            message: " data updated successfully !",
                            dataUpdate
                        })
                    } else if (req.files.chooseImage) {
                        const chooseImage = req.files.chooseImage;

                        const data = await aboutModel.findById(req.params.id)

                        const chooseId = data.chooseImage.public_id
                        await cloudinary.uploader.destroy(chooseId)

                        const chooseResult = await cloudinary.uploader.upload(chooseImage.tempFilePath,
                            {
                                folder: "100acre/aboutPage"
                            })
                        const dataUpdate = await aboutModel.findById(req.params.id, {
                            chooseImage: {
                                public_id: chooseResult.public_id,
                                url: chooseResult.secure_url
                            },
                            sliderHeading: sliderHeading,
                            sliderDescripation: sliderDescripation,
                            aboutHeading: aboutHeading,
                            aboutDescripation: aboutDescripation,
                            chooseHeading: chooseHeading,
                            chooseDescripation: chooseDescripation
                        })
                        //    console.log(dataUpdate)
                        await dataUpdate.save()
                        res.status(200).json({
                            message: " data updated successfully !",
                            dataUpdate
                        })
                    }
                } else {

                    const dataUpdate = await aboutModel.findById(req.params.id, {
                        chooseImage: {
                            public_id: chooseResult.public_id,
                            url: chooseResult.secure_url
                        },
                        sliderHeading: sliderHeading,
                        sliderDescripation: sliderDescripation,
                        aboutHeading: aboutHeading,
                        aboutDescripation: aboutDescripation,
                        chooseHeading: chooseHeading,
                        chooseDescripation: chooseDescripation
                    })
                    await dataUpdate.save()
                    res.status(200).json({
                        message: " data updated successfully !",
                        dataUpdate
                    })
                }
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! ",
            })
        }
    }

    static aboutDelete = async (req, res) => {
        // res.send("hello delete ")
        try {
            const data = await aboutModel.findById(req.params.id)
            const sliderId = data.sliderImage.public_id;
            const aboutId = data.aboutImage.public_id;
            const chooseId = data.chooseImage.public_id; 
            if (sliderId && aboutId && chooseId) {
                await cloudinary.uploader.destroy(sliderId)
                await cloudinary.uploader.destroy(aboutId)
                await cloudinary.uploader.upload(chooseId)

                await aboutModel.findByIdAndDelete(id)
                res.status(200).json({
                    message: "delete successfully ! "
                })
            } else {
                await aboutModel.findByIdAndDelete(req.params.id)
                res.status(200).json({
                    message: "delete successfully ! "
                })
            }


        } catch (error) {
            console.log(error)
            res.status(500).json({
                mesaage:"Internal server error ! "
            })
        }
    }

    //testimonial

    static testimonialInsert = async (req, res) => {
        // res.send("hello insert")
        try {
            const { name, descripation } = req.body
            if (name && descripation) {
                if (req.files.image) {
                    const image = req.files.image

                    const imageResult = await cloudinary.uploader.upload(image.tempFilePath, {
                        folder: "100acre/Testimonial"
                    })

                    const data = new testimonialModel({
                        image: {
                            public_id: imageResult.public_id,
                            url: imageResult.secure_url
                        },
                        name: name,
                        descripation: descripation
                    })
                    // console.log(data)
                    await data.save()
                    // res.json(data)
                    res.status(200).json({
                        message:"data insert successfully ! "
                    })

                } else {
                    res.status(204).json({
                        message: "please select image  !"
                    })
                }
            } else {
                res.status(204).json({
                    message: "please select name and desripation ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong! "
            })
        }
    }
    static testimonialView = async (req, res) => {
        // res.send("hello view ")
        try {
            const id = req.params.id;
            const data = await testimonialModel.findById({_id:id})
            res.status(200).json({
                message:"data get successfully ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong ! "
            })
        }
    }
    static testimonialViewAll=async(req,res)=>{
        // console.log("hello")
        try {
            // console.log("testimonial listen")
            const data=await testimonialModel.find()
            // res.send(data)
            res.status(200).json({
                message:"data get successful ! ",
                data
            })
        } catch (error) {
          console.log(error)
          res.status(500).json({
            message:"internal server error ! "
          }) 
        }
    }

    static testimonialEdit = async (req, res) => {
        try {

            const id = req.params.id
            const data = await testimonialModel.findById({_id:id})
            // res.json(data)
            res.status(200).json({
                message:"data get for edit ! ",
                data
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }

    static testimonialUpdate = async (req, res) => {
       try {
        const{name,descripation}=req.body
        if(name && descripation){
            if(req.files){  
                
                 const image=req.files.image
            
                const id=req.params.id;
                const data= await testimonialModel.findById(id)
  
                const imageData=data.image.public_id;
                await cloudinary.uploader.destroy(imageData)
  
                const imageResult= await cloudinary.uploader.upload(image.tempFilePath , {
                  folder:"100acre/Testimonial"
                })
  
                const dataUpdated= await testimonialModel.findByIdAndUpdate(id ,{
                  image:{
                      public_id:imageResult.public_id,
                      url:imageResult.secure_url
                  },
                  name:name,
                  descripation:descripation
                })
  
                // console.log(dataUpdated)
                await dataUpdated.save()
                  res.status(200).json({
                    message:"data updated successfully ! "
                  })
            }else{
                const id=req.params.id;
                const dataUpdated= await testimonialModel.findByIdAndUpdate(id ,{
               
                    name:name,
                    descripation:descripation
                  }) 
                  await dataUpdated.save()
                //   res.json(dataUpdated)
                res.status(200).json({
                    message:"data updated successfully ! "
                })
            }
        }else{
         res.status(204).json({
            message:"check your field !"
         })
        }
        
       } catch (error) {
        console.log(error)
        res.status(500).json({
            message:"Internal server error ! "
        })
       }
    }

    static testimonialDelete = async (req, res) => {
        try {
            const id=req.params.id
            const imageData= await testimonialModel.findById({_id:id})
            const imageid=imageData.image.public_id
            if(imageid!==null){
                await cloudinary.uploader.destroy(imageid)
            }
            const data=await testimonialModel.findByIdAndDelete({_id:id})
            // res.json(data)
            res.status(200).json({
                message:"data deletd successfully ! "
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message:"Internal server error ! "
            })
        }
    }

}
module.exports = aboutController
