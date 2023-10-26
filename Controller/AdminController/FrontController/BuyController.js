const buyCommercial_Model = require('../../../models/property/buyCommercial');
const cloudinary = require('cloudinary').v2;

class BuyController {
    // Buy Commercial Insert Edit View Update Delete
    static buycommercialInsert = async (req, res) => {
        try {
            const { projectName, propertyTitle, price, state, city, address, type, descripation, amenities, area } = req.body
            if (projectName && propertyTitle && price && state && city && address && type && descripation && amenities && area && req.files) {
                if (req.files.frontImage && req.files.otherImage) {
                    const front = req.files.frontImage;
                    const other = req.files.otherImage

                // const length=other.length;
                // console.log(length)

                    const otherImageLink = []
                    // console.log(otherImageLink)
                    const imageResult = await cloudinary.uploader.upload(
                        front.tempFilePath, {
                        folder: "100acre/BuyCommercial"
                    }

                    )
                    // console.log(imageResult)
                    if(other.length >= 2){
                    for (let i=0; i<other.length; i++) {
                        const otherResult = await cloudinary.uploader.upload(
                            other[i].tempFilePath, {
                            folder: "100acre/BuyCommercial"
                        }
                        );
                        otherImageLink.push({
                            public_id: otherResult.public_id,
                            url: otherResult.secure_url
                        })
                    }
                }else{
                    const otherResult = await cloudinary.uploader.upload(
                        other.tempFilePath, {
                        folder: "100acre/BuyCommercial"
                    }
                    );
                    otherImageLink.push({
                        public_id: otherResult.public_id,
                        url: otherResult.secure_url
                    })
                }
                    const data = new buyCommercial_Model({
                        frontImage: {
                            public_id: imageResult.public_id,
                            url: imageResult.secure_url
                        },
                        otherImage: otherImageLink,
                        projectName: projectName,
                        propertyTitle: propertyTitle,
                        price: price,
                        state: state,
                        city: city,
                        address: address,
                        descripation: descripation,
                        amenities: amenities,
                        type: type,
                        area: area

                    })
                    // console.log(data)
                    await data.save()
                    res.status(201).json({
                        message: "done",
                        dataget: data
                    })
                } else {
                    res.status(403).json({
                        message: "insert not  done",
                    })
                }
            } else {
                res.status(403).json({
                    message: " not  done",
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: "error occured !"
            })
        }

    }

    static viewAll=async(req,res)=>{
        try {
            console.log("hello")
            const data=await buyCommercial_Model.find()
            res.status(200).json({
                message:"All data get successfully ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message:'internal server error'
            })
        }
    }
    
    static buycommercialView = async (req, res) => {
        try {
            const type= req.params.type
            const data = await buyCommercial_Model.find({ type:type })

            res.status(201).json({
                message: "view enable",
                dataview: data
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: "an error is occured",
            })
        }
    }
    static view = async (req, res) => {
        try {
    //    res.send('search with name and type')
         const projectName=req.params.projectName;
         const type=req.params.type;
        const query = { projectName:projectName,type:type };
         const data=await buyCommercial_Model.find(query)
         res.status(200).json({
            message:"data get succesfull",
            datar:data
        })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong ! ",
            })
        }
    }

    static buycommercialEdit = async (req, res) => {
        try {
            const id = req.params.id
            const data = await buyCommercial_Model.findById(id)
            res.status(200).json({
                message: "data get successfully !",
                dataedit: data
            })

        } catch (error) {
            console.log(error);
            res.status(500).json({
                message:"something went wrong ! "
            })
        }
    }

    static buycommercialUpdate = async (req, res) => {
        // res.send("listen update")
        try {
            const { projectName, propertyTitle, city, state, address, price, type, descripation, amenities ,area } = req.body
            if (projectName && propertyTitle && city && state && address && price && type && descripation && amenities && area) {
                if (req.files) {

                    if (req.files.frontImage && req.files.otherImage) {
                        const front = req.files.frontImage;
                        const other = req.files.otherImage;
                        const otherImageLink = [];

                        const data = await buyCommercial_Model.findById(req.params.id)
                        const frontId = data.frontImage.public_id;
                        await cloudinary.uploader.destroy(frontId)

                        const frontResult = await cloudinary.uploader.upload(front.tempFilePath, {
                            folder: "100acre/BuyCommercial"
                        })


                        if (other.length >= 2) {
                            for (let i = 0; i < other.length; i++) {
                                const otherResult = await cloudinary.uploader.upload(other[i].tempFilePath, {
                                    folder: "100acre/BuyCommercial"
                                });
                                otherImageLink.push({
                                    public_id: otherResult.public_id,
                                    url: otherResult.secure_url
                                })
                            }
                        } else {
                            const imageResult = await cloudinary.uploader.upload(other.tempFilePath, {
                                folder: "100acre/BuyCommercial"
                            });

                            otherImageLink.push({
                                public_id: imageResult.public_id,
                                url: imageResult.secure_url
                            });
                        }
                        const result = await buyCommercial_Model.findById(req.params.id)
                        for (let i = 0; i < result.otherImage.length; i++) {
                            otherImageLink.push(
                                result.otherImage[i]
                            );
                        }

                        const dataUpdate = await buyCommercial_Model.findByIdAndUpdate(req.params.id, {
                            frontImage: {
                                public_id: frontResult.public_id,
                                url: frontResult.secure_url
                            },
                            otherImage: otherImageLink,
                            projectName: projectName,
                            propertyTitle: propertyTitle,
                            price: price,
                            state: state,
                            city: city,
                            address: address,
                            descripation: descripation,
                            amenities: amenities,
                            type: type,
                            area:area
                        })
                        // console.log(dataUpdate)
                        await dataUpdate.save()
                        res.status(200).json({
                            message: "successfully updated !",
                            data: dataUpdate
                        })
                    } else if (req.files.frontImage) {
                        const front = req.files.frontImage;
                        const data = await buyCommercial_Model.findById(req.params.id)
                        const imageId = data.frontImage.public_id;
                        await cloudinary.uploader.destroy(imageId)

                        const imageResult = await cloudinary.uploader.upload(front.tempFilePath, {
                            folder: "100acre/BuyCommercial"
                        })

                        const dataUpdate = await buyCommercial_Model.findByIdAndUpdate(req.params.id, {
                            frontImage: {
                                public_id: imageResult.public_id,
                                url: imageResult.secure_url
                            },
                            projectName: projectName,
                            propertyTitle: propertyTitle,
                            price: price,
                            state: state,
                            city: city,
                            address: address,
                            descripation: descripation,
                            amenities: amenities,
                            type: type,
                            area:area

                        })
                        // console.log(dataUpdate)
                        await dataUpdate.save()
                        res.status(200).json({
                            message: "successfully updatede !",
                            data: dataUpdate
                        })

                    }
                    else if (req.files.otherImage) {
                        const other = req.files.otherImage;
                        const otherImageLink = []

                        if (other.length >= 2) {
                            for (let i = 0; i < other.length; i++) {
                                const otherimage = await cloudinary.uploader.upload(other[i].tempFilePath, {
                                    folder: "100acre/BuyCommercial"
                                })
                                otherImageLink.push({
                                    public_id: otherimage.public_id,
                                    url: otherimage.secure_url
                                })
                            }
                        } else {
                            const imageResult = await cloudinary.uploader.upload(other.tempFilePath, {
                                folder: "100acre/BuyCommercial"
                            });

                            otherImageLink.push({
                                public_id: imageResult.public_id,
                                url: imageResult.secure_url
                            })

                        }

                        const result = await buyCommercial_Model.findById(req.params.id)
                        for (let i = 0; i < result.otherImage.length; i++) {
                            otherImageLink.push(
                                result.otherImage[i]
                            );
                        }
                        const dataUpdate = await buyCommercial_Model.findByIdAndUpdate(req.params.id, {

                            otherImage: otherImageLink,
                            projectName: projectName,
                            propertyTitle: propertyTitle,
                            price: price,
                            state: state,
                            city: city,
                            address: address,
                            descripation: descripation,
                            amenities: amenities,
                            type: type,
                            area:area
                        })
                        // console.log(dataUpdate)
                        await dataUpdate.save()
                        res.status(200).json({
                            message: "successfully updated !",
                            data: dataUpdate
                        })
                    }

                } else {
                    const dataset = await buyCommercial_Model.findByIdAndUpdate(req.params.id, {
                        projectName: projectName,
                        propertyTitle: propertyTitle,
                        price: price,
                        state: state,
                        city: city,
                        address: address,
                        descripation: descripation,
                        amenities: amenities,
                        type: type,
                        area:area
                    })
                    // console.log(dataset)
                    await dataset.save()
                    res.status(200).json({
                        message: "successfully updated !",
                        data: dataset
                    })
                }
            } else {
                res.status(403).json({
                    message: "require all field !"
                })
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message:"something went wrong ! "
            })
        }
    }

    static buycommercialDelete = async (req, res) => {
        try {
            const id = req.params.id;
            // console.log(id)
            // const data = await buyCommercial_Model.findByIdAndDelete(id)
            const result = await buyCommercial_Model.findById(req.params.id)
            const imageId = result.frontImage.public_id
            await cloudinary.uploader.destroy(imageId)

            for (let i = 0; i < result.length; i++) {
                const otherResult = await buyCommercial_Model.findById(req.params.id)
                const otherId = otherResult.otherImage[i].public_id
                await cloudinary.uploader.destroy(otherId)
            }

            await buyCommercial_Model.findByIdAndDelete(req.params.id)

            res.status(200).json({
                message: "data deleted successfully !",
                // datadelete: data
            })
        } catch (error) {
            console.log(error);
            res.status(500).json({
               message:"something went wrong ! "
            })
        }
    }
}
module.exports = BuyController
                    