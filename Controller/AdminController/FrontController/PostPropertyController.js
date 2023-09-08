const postPropertyModel = require("../../../models/postProperty/post")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer")
const otpGenerator = require('otp-generator')
const cloudinary = require('cloudinary').v2;


// email sender
// const sendEmailOtp=async(email,otp)=>{
//     const transporter=await nodemailer.createTransport({
//       host: 'smtp.gmail.com',
//       port:587,
//       auth:{
//         user: process.env.Email,
//         pass: process.env.EmailPass
//       }  
//     });

//     let info=await transporter.sendMail({
//        from:'test@gmail.com',
//        to:"amit100acre@gmail.com",//email replace this 
//        subject:'Password Reset',
//        html:`${otp}` 
//     })
// }


class PostPropertyController {

    // seller work Registration work

    static postPerson_Register = async (req, res) => {
        try {
            const { name, email, address, mobile, password, cpassword } = req.body
            // console.log(req.body
            const verify = await postPropertyModel.findOne({ email: email })

            if (verify) {
                res.status(500).json({
                    message: "user already register"
                })
            }
            else {
                if (name && email && password && cpassword && address && mobile) {
                    if (password.length < 8) {
                        res.status(400).json({
                            message: "password at least 8 character"
                        })
                    } else {
                        if (password == cpassword) {
                            const hashpassword = await bcrypt.hash(password, 10)
                            const data = new postPropertyModel({

                                name: name,
                                email: email,
                                password: hashpassword,
                                address: address,
                                mobile: mobile,
                            })
                            console.log(data)
                            await data.save()

                            res.status(200).json({
                                message: "registration successful ! "
                            })

                        } else {
                            res.status(500).json({
                                message: "passwprd and Confirm password does not match  ! "
                            })
                        }
                    }
                } else {
                    res.status(500).json({
                        message: "passwprd and Confirm password does not match  ! "
                    })
                }
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error !"
            })
        }
    }


    // post property
    static postProperty = async (req, res) => {
        try {
            const { propertyType, propertyName, address, city, state, price, area, descripation, landMark, amenities, builtYear, furnishing, type, availableDate } = req.body

            const frontImage = req.files.frontImage;
            const frontResult = await cloudinary.uploader.upload(
                frontImage.tempFilePath, {
                folder: "100acre/Postproperty"
            }
            )
            const otherImage = req.files.otherImage;
            const otherImagelink = []
            if (otherImage.length >= 2) {
                for (let i = 0; i < otherImage.length; i++) {
                    const otherResult = await cloudinary.uploader.upload(
                        otherImage[i].tempFilePath, {
                        folder: "100acre/Postproperty"
                    }
                    );
                    otherImagelink.push({
                        public_id: otherResult.public_id,
                        url: otherResult.secure_url
                    })
                }
            } else {
                const otherResult = await cloudinary.uploader.upload(
                    otherImage.tempFilePath, {
                    folder: "100acre/Postproperty"
                }
                );
                otherImagelink.push({
                    public_id: otherResult.public_id,
                    url: otherResult.secure_url
                })

            }

            const data = {
                propertyType: propertyType,
                propertyName: propertyName,
                address: address,
                city: city,
                state: state,
                price: price,
                area: area,
                descripation: descripation,
                landMark: landMark,
                amenities: amenities,
                builtYear: builtYear,
                furnishing: furnishing,
                type: type,
                availableDate: availableDate,
                frontImage: {
                    public_id: frontResult.public_id,
                    url: frontResult.secure_url
                },
                otherImage: otherImagelink
            }
            // console.log(data)
            const id = req.params.id
            // const postData= await postPropertyModel.findOne({ email: email })
            // const id=postData.id;
            // console.log(id)
            const dataPushed = await postPropertyModel.findOneAndUpdate(
                { _id: id },
                { $push: { postProperty: data } },
                { new: true })

            res.send(dataPushed)

        } catch (error) {
            console.log(error)
        }
    }

    static postProperty_View = async (req, res) => {
        // console.log("vieww")
        try {
            const id = req.params.id
            // console.log(id)
            const data = await postPropertyModel.findById(id)
            // console.log(data)
            res.status(200).json({
                message: "data get !",
                data
            })

        } catch (error) {
            console.log(error)
        }
    }

    static postPropertyOne_View = async (req, res) => {
        try {
            // console.log("one view")
            const id = req.params.id
            const data = await postPropertyModel.findOne({ "postProperty._id": id },
                {
                    postProperty: {
                        $elemMatch: {
                            _id: id,
                        },
                    },
                }
            )
            res.send(data)
        } catch (error) {
            console.log(error)
        }
    }
    static postProperty_Edit = async (req, res) => {
        try {
            // console.log(req.params.id)
            const id = req.params.id
            const data = await postPropertyModel.findOne({}, {
                postProperty: {
                    $elemMatch: {
                        _id: id
                    }
                }
            })
            // console.log(data)
            res.status(200).json({
                message: "data get Successsfully ! ",
                data
            })
        } catch (error) {
            console.log(error)
        }
    }
    static postProperty_Update = async (req, res) => {
        // console.log("hello")
        // res.send("post property listen")
        try {
            const { propertyName, propertyType, address, area, city, state, price, descripation, furnishing, builtYear, type, amenities, landMark, availableDate, } = req.body

            if (req.files) {
                if (req.files.frontImage && req.files.otherImage) {
                    const frontImage = req.files.frontImage;
                    const otherImage = req.files.otherImage;
                    const otherImageLink = []


                    const id = req.params.id
                    const data = await postPropertyModel.findOne({}, {
                        postProperty: {
                            $elemMatch: {
                                _id: id
                            }
                        }
                    })

                    const frontId = data.postProperty[0].frontImage.public_id;
                    console.log(frontId)
                    await cloudinary.uploader.destroy(frontId)
                    const frontResult = await cloudinary.uploader.upload(
                        frontImage.tempFilePath, {
                        folder: "100acre/Postproperty"
                    }
                    )

                    const Id = data['postProperty'][0]._id
                    // console.log(Id)

                    // const otherImageArray = data.postProperty[0].otherImage;
                    // const publicIds = otherImageArray.map(image => image.public_id);
                    if (otherImage.length >= 2) {
                        for (let i = 0; i < otherImage.length; i++) {
                            const otherResult = await cloudinary.uploader.upload(
                                otherImage[i].tempFilePath, {
                                folder: "100acre/Postproperty"
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
                            folder: "100acre/Postproperty"
                        }
                        );
                        otherImageLink.push({
                            public_id: otherResult.public_id,
                            url: otherResult.secure_url
                        })

                    }
                    const update = {
                        frontImage: {
                            public_id: frontResult.public_id,
                            url: frontResult.secure_url
                        },
                        otherImage: otherImageLink,
                        propertyName: propertyName,
                        propertyType: propertyType,
                        area: area,
                        city: city,
                        state: state,
                        address: address,
                        availabledate: availableDate,
                        price: price,
                        descripation: descripation,
                        furnishing: furnishing,
                        builtYear: builtYear,
                        landMark: landMark,
                        type: type,
                        amenities: amenities
                    }
                    console.log(update)
                    // console.log(otherImageLink)
                    const dataUpdate = await postPropertyModel.findOneAndUpdate(
                        { 'postProperty._id': Id }, { $set: { 'postProperty.$': update } }, { new: true }
                    )


                    res.status(200).jsos({
                        message: "postProperty successfully update ! ",
                        dataUpdate
                    })

                } else if (req.files.frontImage) {
                    // res.send("front image")
                    const frontImage = req.files.frontImage;

                    const id = req.params.id;
                    const data = await postPropertyModel.findOne({}, {
                        postProperty: {
                            $elemMatch: {
                                _id: id
                            }
                        }
                    })

                    // console.log("hello", data)
                    const frontId = data.postProperty[0].frontImage.public_id;

                    await cloudinary.uploader.destroy(frontId)
                    const frontResult = await cloudinary.uploader.upload(
                        frontImage.tempFilePath,
                        { folder: "100acre/Postproperty" }
                    )

                    const update = {
                        frontImage: {
                            public_id: frontResult.public_id,
                            url: frontResult.secure_url
                        },
                        propertyName: propertyName,
                        propertyType: propertyType,
                        area: area,
                        city: city,
                        state: state,
                        address: address,
                        availableDate: availableDate,
                        price: price,
                        amenities: amenities,
                        furnishing: furnishing,
                        builtYear: builtYear,
                        type: type,
                        landMark: landMark,
                        descripation: descripation
                    }

                    console.log(update)
                    const dataUpdate = await postPropertyModel.findOneAndUpdate(
                        { "postProperty._id": id }, { $set: { 'postProperty.$': update } }
                    )
                    res.send(dataUpdate)
                } else if (req.files.otherImage) {
                    // res.send("listn other")
                    const otherImage = req.files.otherImage;
                    const id = req.params.id;
                    //   console.log(id,otherImage)
                    // const data = await postPropertyModel.findOne({}, {
                    //     postProperty: {
                    //         $elemMatch: {
                    //             _id: id
                    //         }
                    //     }
                    // })

                    // console.log(data)
                    // const otherId=data.postProperty[0].frontImage.public_id
                    // console.log(otherId)
                    const otherImageLink = []
                    if (otherImage.length >= 2) {
                        for (let i = 0; i < otherImage.length; i++) {
                            const otherResult = await cloudinary.uploader.upload(
                                otherImage[i].tempFilePath,
                                {
                                    folder: "100acre/Postproperty"
                                }
                            )
                            otherImageLink.push({
                                public_id: otherResult.public_id,
                                url: otherResult.secure_url
                            })
                        }
                    } else {
                        const otherResult = await cloudinary.uploader.upload(
                            otherImage.tempFilePath,
                            {
                                folder: "100acre/Postproperty"
                            }
                        )
                        otherImageLink.push({
                            public_id: otherResult.public_id,
                            url: otherResult.secure_url
                        })
                    }
                    const data = await postPropertyModel.findOne({}, {
                        postProperty: {
                            $elemMatch: {
                                _id: id
                            }
                        }
                    })
                    const other = data.postProperty[0]
                    // console.log(other)
                    for(let i=0;i<other.otherImage.length;i++){
                         otherImageLink.push(
                            other.otherImage[i]
                         )
                    }

                    const update={
                        otherImage:otherImageLink,
                        propertyName:propertyName,
                        propertyType:propertyType,
                        area:area,
                        city:city,
                        state:state,
                        address:address,
                        availableDate:availableDate,
                        builtYear:builtYear,
                        type:type,
                        price:price,
                        landMark:landMark,
                        descripation:descripation,
                        amenities:amenities,
                        furnishing:furnishing

                    }
                    // console.log(update)
                    const dataUpdate=await postPropertyModel.findOneAndUpdate(
                        {"postProperty._id":id},{$set:{"postProperty.$":update}}
                    )
                    res.status(200).json({
                        message:"updated successfully ! ",
                        dataUpdate
                    })

                }
            } else {

            
                const id = req.params.id;
                const update={
                    propertyName:propertyName,
                    propertyType:propertyType,
                    area:area,
                    city:city,
                    state:state,
                    address:address,
                    availableDate:availableDate,
                    builtYear:builtYear,
                    type:type,
                    price:price,
                    landMark:landMark,
                    descripation:descripation,
                    amenities:amenities,
                    furnishing:furnishing

                }

                   console.log(update)
                   const dataUpdate=await postPropertyModel.findOneAndUpdate(
                    {"postProperty._id":id},{$set:{"postProperty.$":update}}
                )
                res.status(200).json({
                    message:"updated successfully ! ",
                    dataUpdate
                })

            }
        } catch (error) {
            console.log(error)
            res.status(500)
        }
    }
static postProperty_Delete=async(req,res)=>{
    // console.log("hello ")
    // res.send("delete ")
    try {
        
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message:"something went wrong "
        })
    }
}
}
module.exports = PostPropertyController