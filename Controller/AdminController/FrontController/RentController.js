const postPropertyModel = require('../../../models/postProperty/post');
const buyCommercial_Model = require('../../../models/property/buyCommercial');
const rent_Model = require('../../../models/property/rent');
const NodeCache = require("node-cache");
const cache = new NodeCache();


const cloudinary = require('cloudinary').v2;
class rentController {

    // Rent Property Insert Edit view delete
    //Insert
    static rentInsert = async (req, res) => {
        // res.send("listen rent insert ! ")
        try {
            // console.log("hello")
            const { propertyType, propertyName, price, area, availableDate, descripation,
                furnishing, builtYear, amenities, landMark, type, city, state, address } = req.body

            if ( propertyType && propertyName && price && area && availableDate && descripation
                && furnishing && builtYear && amenities && landMark && type && city && state && address) {

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
                        propertyType: propertyType,
                        propertyName: propertyName,
                        price: price,
                        area: area,
                        availableDate: availableDate,
                        descripation: descripation,
                        furnishing: furnishing,
                        builtYear: builtYear,
                        amenities: amenities,
                        landMark: landMark,
                        type: type,
                        city: city,
                        state: state,
                        address: address

                    })
                    await data.save()
                    res.status(200).json({
                        message: "Rental data insert successfully",
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
                error: "internal server error !",
            })
        }
    }
    //edit
    static rentEdit = async (req, res) => {
        // res.send("rent edit ")
        try {
            // console.log("edit")
            const id = req.params.id
            if (id.length > 0) {
                const data = await rent_Model.findById({
                    _id: id
                })
                res.status(200).json({
                    message: "Data get successfully !",
                    dataEdit: data
                })
            } else {
                res.status(201).json({
                    message: "Id can not read ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: "Internal server error !"
            })
        }
    }
    // rental property view by id
    static rentView_id = async (req, res) => {
        // console.log("helllo")
        try {
            // console.log("hello")
            const id = req.params.id
            if (id) {
                const data = await rent_Model.findById({ _id: id })

                const postData= await postPropertyModel.findOne({ "postProperty._id": id },
                {
                    postProperty: {
                        $elemMatch: {
                            _id: id,
                        },
                    },
                }
            )
            //  const data1=postData.postProperty[0]
                if (data) {
                    res.status(200).json({
                        message: 'data get successfully !',
                        data: data
                    })
                } else {
                    res.status(200).json({
                        message: "data get successfully ! "
                        , postData
                    })
                }
            } else {
                res.status(200).json({
                    message: "data not found !"
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! "
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
                message: "Data get Successfully ! ",
                dataView: data
            })
        } catch (error) {
            res.status(500).json({
                message: "Internal server error !"
            })
        }
    }
    // ViewAll
    static rentViewAll = async (req, res) => {
        try {
            const data = await rent_Model.find()
            const data1 = await postPropertyModel.aggregate([
                {
                    $match: {
                        "postProperty.verify": "verified"
                    }
                },
                {
                    $project: {
                        name: 1,
                        postProperty: {
                            $filter: {
                                input: "$postProperty",
                                as: "property",
                                cond: {
                                    $and: [
                                        { $eq: ["$$property.propertyLooking", "rent"] },
                                        { $eq: ["$$property.verify", "verified"] }
                                    ]
                                }
                            }
                        }
                    }
                }
            ]);
            if (data) {
                res.status(200).json({

                    done: data1,
                    message: "data get successfully !",
                    data

                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    // rental property upadted api 
    static rentUpdate = async (req, res) => {
        // res.send("listen rent  update ")
        try {
            const {  propertyType, propertyName, city, state, address, price, area, availableDate, descripation, furnishing, builtYear, amenities, landmark, type } = req.body

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

                    const dataUpdate = await rent_Model.findByIdAndUpdate(req.params.id, {
                        frontImage: {
                            public_id: frontResult.public_id,
                            url: frontResult.secure_url
                        },
                        otherImage: otherImageLink,
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
                        message: "update successfully !",
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
                        message: "update successfull !",
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
                        message: "updated successfuly !",
                        dataUpdate
                    })
                }
            } else {
                const dataUpdate = await rent_Model.findByIdAndUpdate(req.params.id, {
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
                    message: " data updated successfully ! "
                })
            }

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    // rental property delete api
    static rentDelete = async (req, res) => {
        try {
            // console.log("error ")
            const id = req.params.id
            const image = await rent_Model.findById({ _id: id })
            const imageId = image.frontImage.public_id;

            await cloudinary.uploader.destroy(imageId)

            for (let i = 0; i < image.length; i++) {
                const otherResult = await rent_Model.findById({ _id: id })
                const otherId = otherResult.otherImage[i].public_id;
                await cloudinary.uploader.upload(otherId)
            }
            await rent_Model.findByIdAndDelete({ _id: id })

            res.status(200).json({
                message: " data deleted successfully !"
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }




    


}
module.exports = rentController