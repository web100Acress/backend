const rent_Model = require('../../../models/property/rent');

const cloudinary = require('cloudinary').v2;
class rentController {

    // Rent Property Insert Edit view delete
    //Insert
    static rentInsert = async (req, res) => {
        // res.send("listen rent insert !")
        try {
            // console.log("hello")
            const { projectName, propertyType, propertyName, price, area, availableDate, descripation,
                furnishing, builtYear, amenities, landmark, type, city, state, address } = req.body
            if (projectName && propertyType && propertyName && price && area && availableDate && descripation
                && furnishing && builtYear && amenities && landmark && type && city && state && address) {
                if (req.files.frontImage && req.files.otherImage) {
                    const frontImage = req.files.frontImage
                    const otherImage = req.files.otherImage

                    const frontResult = await cloudinary.uploader.upload(frontImage.tempFilePath, {
                        folder: "100acre/Rental_Property"
                    })

                    const otherImageLink = []

                    if (otherImage.length >= 2) {
                        for (let i = 0; i < otherImage.length; i++) {
                            const otherResult = await cloudinary.uploader.upload(
                                otherImage[i].tempFilePath, {
                                folder: "100acre/Rental_Property"
                            }
                            );
                            otherImageLink.push({
                                public_id: otherResult.public_id,
                                url: otherResult.secure_url
                            })
                        }
                    } else {
                        const otherResult = await cloudinary.uploader.upload(
                            otherImage.tempFilePath, {
                            folder: "100acre/Rental_Property"
                        }
                        );
                        otherImageLink.push({
                            public_id: otherResult.public_id,
                            url: otherResult.secure_url
                        })

                    }
                    const data = new rent_Model({
                        frontImage: {
                            public_id: frontResult.public_id,
                            url: frontResult.secure_url
                        },
                        otherImage: otherImageLink,
                        projectName: projectName,
                        propertyType: propertyType,
                        propertyName: propertyName,
                        price: price,
                        area: area,
                        availableDate: availableDate,
                        descripation: descripation,
                        furnishing: furnishing,
                        builtYear: builtYear,
                        amenities: amenities,
                        landmark: landmark,
                        type: type,
                        city: city,
                        state: state,
                        address: address

                    })
                    await data.save()
                    res.status(200).json({
                        message: "rental data insert successfully",
                        dataRent: data
                    })

                } else {
                    res.status(403).json({
                        message: "check image field !"
                    })
                }

            } else {
                res.status(403).json({
                    message: "check all field !"
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: "an error is occured",
            })
        }
    }
    //edit
    static rentEdit = async (req, res) => {
        // res.send("rent edit ")
        try {
            // console.log("edit")
            const id = req.params.id
            const data = await rent_Model.findById(id)
            res.status(200).json({
                message: "data get successfully !",
                dataEdit: data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: "something went wrong !"
            })
        }
    }
    //view
    static rentView = async (req, res) => {
        // res.send("listen  rent view ")
        try {
            // const id = req.params.id
            const type = req.params.type
            const data = await rent_Model.find({ type: type })
            res.status(200).json({
                message: "data get successfully !",
                dataView: data
            })
        } catch (error) {
            res.status(500).json({
                message: "something went wrong !"
            })
        }
    }
    // update
    static rentUpdate = async (req, res) => {
        // res.send("listen rent  update ")
        try {
            const { projectName, propertyType, propertyName, city, state, address, price, area, availableDate, descripation, furnishing, builtYear, amenities, landmark, type } = req.body
            if (projectName && propertyType && propertyName && city && state && address && price && area && availableDate && descripation && furnishing && builtYear && amenities && landmark && type) {
                if (req.files) {
                    if (req.files.frontImage && req.files.otherImage) {
                        const front = req.files.frontImage;
                        const other = req.files.otherImage

                        const otherImageLink = []

                        const data = await rent_Model.findById(req.params.id)
                        const frontId = data.frontImage.public_id;
                        await cloudinary.uploader.destroy(frontId)

                        const frontResult = await cloudinary.uploader.upload(
                            front.tempFilePath, {
                            folder: "100acre/Rental_Property"
                        }
                        )
                        //  console.log(frontResult)
                        if (other.length >= 2) {
                            for (let i = 0; i < other.length; i++) {
                                const otherResult = await cloudinary.uploader.upload(
                                    other[i].tempFilePath, {
                                    folder: "100acre/Rental_Property"
                                })

                                otherImageLink.push({
                                    public_id: otherResult.public_id,
                                    url: otherResult.secure_url
                                })
                            }
                        } else {
                            const otherResult = await cloudinary.uploader.upload(
                                other.tempFilePath, {
                                folder: "100acre/Rental_Property"
                            })
                            otherImageLink.push({
                                public_id: otherResult.public_id
                            })
                        }

                        const result = await rent_Model.findById(req.params.id)
                        for (let i = 0; i < result.otherImage.length; i++) {

                            otherImageLink.push(
                                result.otherImage[i]
                            )
                        }
                        // console.log(otherImageLink)
                        const dataUpdate = await rent_Model.findByIdAndUpdate(req.params.id, {
                            frontImage: {
                                public_id: frontResult.public_id,
                                url: frontResult.secure_url
                            },
                            otherImage: otherImageLink,
                            projectName: projectName,
                            propertyType: propertyType,
                            propertyname: propertyName,
                            city: city,
                            state: state,
                            address: address,
                            price: price,
                            area: area,
                            availableDate: availableDate,
                            descripation: descripation,
                            furnishing: furnishing,
                            builtYear: builtYear,
                            amenities: amenities,
                            landmark: landmark,
                            type: type

                        })
                        // console.log(dataUpdate)
                        res.status(200).json({
                            message:"update successfully !",
                            dataUpdate
                        })

                    } else if (req.files.frontImage) {
                        const front = req.files.frontImage;
                        const data = await rent_Model.findById(req.params.id)
                        const frontId = data.frontImage.public_id;
                        await cloudinary.uploader.destroy(frontId)

                        const frontResult = await cloudinary.uploader.upload(
                            front.tempFilePath, {
                            folder: "100acre/Rental_Property"
                        }
                        )

                        const dataUpdate = await rent_Model.findByIdAndUpdate(req.params.id, {
                            frontImage: {
                                public_id: frontResult.public_id,
                                url: frontResult.secure_url
                            },
                            projectName: projectName,
                            propertyType: propertyType,
                            propertyName: propertyName,
                            city: city,
                            state: state,
                            address: address,
                            price: price,
                            area: area,
                            availableDate: availableDate,
                            descripation: descripation,
                            furnishing: furnishing,
                            builtYear: builtYear,
                            amenities: amenities,
                            landmark: landmark,
                            type: type


                        })
                        // console.log(dataUpdate)
                        res.status(200).json({
                           message:"update successfull !",
                           dataUpdate 
                        })

                    } else if (req.files.otherImage) {
                        const other = req.files.otherImage
                        const otherImagelink = []

                        if (other.length >= 2) {
                            for (let i = 0; i < other.length; i++) {

                                const otherResult = await cloudinary.uploader.upload(
                                    other[i].tempFilepath,
                                    {
                                        folder: "100acre/Rental_Property"
                                    }
                                )
                                otherImagelink.push({
                                    public_id: otherResult.public_id,
                                    url: otherResult.secure_url
                                })
                            }
                        } else {
                            const otherResult = await cloudinary.uploader.upload(
                                other.tempFilePath, {
                                folder: "100acre/Rental_Property"
                            }
                            )
                            otherImagelink.push({
                                public_id: otherResult.public_id,
                                url: otherResult.secure_url
                            })
                        }
                        const result = await rent_Model.findById(req.params.id)
                        for (let i = 0; i < result.otherImage.length; i++) {
                            otherImagelink.push(
                                result.otherImage[i]
                            )
                        }

                        const dataUpdate = await rent_Model.findByIdAndUpdate(req.params.id, {
                            otherImage: otherImagelink,
                            projectName: projectName,
                            propertyType: propertyType,
                            propertyName: propertyName,
                            city: city,
                            state: state,
                            address: address,
                            area: area,
                            availableDate: availableDate,
                            descripation: descripation,
                            furnishing: furnishing,
                            builtYear: builtYear,
                            amenities: amenities,
                            landmark: landmark,
                            type: type
                        })
                        // console.log(dataUpdate)
                        await dataUpdate.save()
                        res.status(200).json({
                            message:"updated successfuly !",
                            dataUpdate
                        })
                    }
                } else {
                    const dataUpdate = await rent_Model.findByIdAndUpdate(req.params.id, {
                        projectName: projectName,
                        propertyType: propertyType,
                        propertyName: propertyName,
                        city: city,
                        state: state,
                        address: address,
                        price: price,
                        area: area,
                        availableDate: availableDate,
                        descripation: descripation,
                        furnishing: furnishing,
                        builtYear: builtYear,
                        amenities: amenities,
                        landmark: landmark,
                        type: type

                    })
                    // console.log(dataUpdaate)
                    await dataUpdate.save()
                    res.status(200).json({
                        message:"update successfully !",
                        dataUpdaate
                    })
                }
            } else {
                res.status(500).json({
                    message: "somthing going wrong !"
                })
            }
        } catch (error) {
            console.log(error)
        }
    }
    //delete
    static rentDelete = async (req, res) => {
        try {
            // console.log("hello")
            const image = await rent_Model.findById(req.params.id)
            const imageId = image.frontImage.public_id;

            await cloudinary.uploader.destroy(imageId)

            for (let i = 0; i < image.length; i++) {
                const otherResult = await rent_Model.findById(req.params.id)
                const otherId = otherResult.otherImage[i].public_id;
                await cloudinary.uploader.upload(otherId)
            }
            await rent_Model.findByIdAndDelete(req.params.id)

            res.status(200).json({
                message: "delete successfully !"
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: "something went wrong !"
            })
        }
    }

}
module.exports = rentController