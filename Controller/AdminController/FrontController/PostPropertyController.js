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
    
    static postProperty_View=async(req,res)=>{
        // console.log("vieww")
        try {
            const id=req.params.id
            // console.log(id)
            const data=await postPropertyModel.findById(id)
            // console.log(data)
            res.status(200).json({
                message: "data get !",
                data
            })
            
        } catch (error) {
         console.log(error)   
        }
    }

    static postPropertyOne_View=async(req,res)=>{
       try {
         // console.log("one view")
         const id=req.params.id
         const data = await postPropertyModel.findOne({"postProperty._id":id }, 
         {
             postProperty: {
                 $elemMatch: {
                     _id:id,
                 },
             },
         }
         )
         res.send(data)
       } catch (error) {
        console.log(error)
       }
    }
    static postProperty_Edit=async(req,res)=>{
       try {
        // console.log(req.params.id)
        const id=req.params.id
        const data=await postPropertyModel.findOne({},{
         postProperty:{
            $elemMatch:{
                _id:id
            }
         }
        })
        console.log(data)
       } catch (error) {
        console.log(error)
       }
    }

}
module.exports = PostPropertyController