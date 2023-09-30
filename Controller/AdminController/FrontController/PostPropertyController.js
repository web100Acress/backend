const postPropertyModel = require("../../../models/postProperty/post")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer")
const otpGenerator = require('otp-generator')
const cloudinary = require('cloudinary').v2;




const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const sendResetEmail = async (email, token) => {
    // Connect with SMTP Gmail
    const transporter = await nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: process.env.Email,
            pass: process.env.EmailPass
        },
    });
    // Send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'test@gmail.com', // Sender address
        to: "amit100acre@gmail.com", // List of receivers (admin's email) =='query.aadharhomes@gmail.com'
        subject: 'Password Reset',

        // html: `Click the following link to reset your password: http://localhost:3500/reset/${token}`, // HTML body
        html: `
        <!DOCTYPE html>
        <html lang:"en>
        <head>
        <meta charset:"UTF-8">
        <meta http-equiv="X-UA-Compatible"  content="IE=edge">
        <meta name="viewport"  content="width=device-width, initial-scale=1.0">
        <title>Forgot Password</title>
        </head>
        <body>
        <p>Dear User ,</p>
        <p>Click the following link to reset your password :</p>
        <p>

        <a href="http://localhost:3500/postProperty/reset/${token}" target="_blank" rel="noopener noreferrer">Reset Your Password </a>
        </p>
        </p>

        <p>If you didn't request to password reset , please ignore this email. </p>

       <p>Best regrads ,
            <br>https://www.100acress.com/
       </p>
       <form action="http://localhost:3500/postProperty/reset/${token}" method="POST">
       <label for="newPassword">New Password:</label>
       <input type="password"  name="password" required>
       <button type="submit">Update Password</button>
   </form>
        </body>
        </html>
`
    });

}


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
    // verify login for seller
    static postPerson_VerifyLogin = async (req, res) => {
        // console.log("hello")
        try {
            // res.send("listen the verify")
            const { email, password } = req.body
            if (email && password) {
                const User = await postPropertyModel.findOne({ email: email })
                // console.log(User)
                if (User != null) {
                    // console.log("hello")
                    const isMatch = await bcrypt.compare(password, User.password)
                    // console.log(isMatch)
                    if ((email == email) && isMatch) {
                        if (User.role == 'Seller') {
                            //   console.log("seller")
                            const token = jwt.sign({ user_id: User._id }, 'amitchaudhary100')
                            // console.log(token)
                            res.status(200).json({
                                message: " login successful! ",
                                token: token,
                            })
                        } else {
                            res.status(500).json({
                                message: "something went wrong "
                            })
                        }
                    } else {
                        res.status(500).json({
                            message: "check your email and password"
                        })
                    }

                } else {
                    res.status(500).json({
                        message: "register first "
                    })
                }
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong ! ",
                error
            })
        }
    }
    // logout
    static postPerson_logout = async (req, res) => {

        try {
            //    console.log("hello logout")  
            res.clearCookie('token')
            res.status(200).json({
                message: "logout !"
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong ! "
            })
        }
    }
    //forget password
    static postPerson_forget = async (req, res) => {
        const { email } = req.body
        // console.log(email)
        try {

            const user = await postPropertyModel.findOne({ email: email })
            console.log(user)
            if (!user) {
                res.status(404).json({
                    message: "user not found ! "
                })
            } else {
                const token = generateToken()
                const resetToken = await postPropertyModel.findByIdAndUpdate(user._id, {
                    token: token
                })
                // console.log(token)
                await resetToken.save()
                await sendResetEmail(email, token)
                //  console.log(resetToken)
                res.status(200).json({
                    message: "password reset link sent successfully"
                })
            }

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error "
            })
        }
    }
    // Reset Password
    static postPerson_reset = async (req, res) => {

        // console.log("hello")
        // res.send("hello")
        try {
            // console.log("hj")
            const { token } = req.params
            const { password } = req.body
            const hashpassword = await bcrypt.hash(password, 10)
            // console.log(hashpassword)
            const user = await postPropertyModel.findOneAndUpdate({ token: token }, ({
                password: hashpassword
            }))
            // console.log(user)
            user.token = ""
            await user.save()
            res.status(200).json({
                message: "your password successfully updated"
            })

        }
        catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error"
            })
        }



    }
    //viewAll
    static postPerson_View = async (req, res) => {
        // console.log("hello")
        try {
            const data = await postPropertyModel.find()
            res.status(200).json({
                message: "data get successfully ! ",
                data
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! "
            })
        }
    }
    // edit
    static postPerson_Edit = async (req, res) => {
        // console.log("hello")
        try {
            // console.log("helo")
            const id = req.params.id;
            const data = await postPropertyModel.findById({ _id: id })
            res.status(200).json({
                message: "data get sucessfully ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! "
            })
        }

    }
    // update
    static postPerson_update = async (req, res) => {
        // console.log("hello")
        const { name, email, address, mobile } = req.body
        const data = await postPropertyModel.findByIdAndUpdate(req.params.id, {
            name: name,
            email: email,
            address: address,
            mobile: mobile

        })
        await data.save()
        res.status(200).json({ data })
        try {

        } catch (error) {
            console.log(error)
        }
    }
    // delete account
    static postPerson_accountDelete = async (req, res) => {
        // console.log("hello")
        try {
            const id = req.params.id;
            const data = await postPropertyModel.findByIdAndDelete({ _id: id })
            res.status(200).json({
                message: "data deleted successfully !"
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! ",

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
            res.status(500).json({
                message: "something went wrong"
            })
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
                    for (let i = 0; i < other.otherImage.length; i++) {
                        otherImageLink.push(
                            other.otherImage[i]
                        )
                    }

                    const update = {
                        otherImage: otherImageLink,
                        propertyName: propertyName,
                        propertyType: propertyType,
                        area: area,
                        city: city,
                        state: state,
                        address: address,
                        availableDate: availableDate,
                        builtYear: builtYear,
                        type: type,
                        price: price,
                        landMark: landMark,
                        descripation: descripation,
                        amenities: amenities,
                        furnishing: furnishing

                    }
                    // console.log(update)
                    const dataUpdate = await postPropertyModel.findOneAndUpdate(
                        { "postProperty._id": id }, { $set: { "postProperty.$": update } }
                    )
                    res.status(200).json({
                        message: "updated successfully ! ",
                        dataUpdate
                    })

                }
            } else {


                const id = req.params.id;
                const update = {
                    propertyName: propertyName,
                    propertyType: propertyType,
                    area: area,
                    city: city,
                    state: state,
                    address: address,
                    availableDate: availableDate,
                    builtYear: builtYear,
                    type: type,
                    price: price,
                    landMark: landMark,
                    descripation: descripation,
                    amenities: amenities,
                    furnishing: furnishing

                }

                console.log(update)
                const dataUpdate = await postPropertyModel.findOneAndUpdate(
                    { "postProperty._id": id }, { $set: { "postProperty.$": update } }
                )
                res.status(200).json({
                    message: "updated successfully ! ",
                    dataUpdate
                })

            }
        } catch (error) {
            console.log(error)
            res.status(500)
        }
    }
    static postProperty_Delete = async (req, res) => {

        try {
            // console.log("hello")
            const id = req.params.id
            const data = await postPropertyModel.findOne({},
                {
                    postProperty: {
                        $elemMatch: {
                            _id: id
                        }
                    }
                })

            // console.log(data)
            const frontId = data.postProperty[0].frontImage.public_id;
            // console.log(frontId)
            if (frontId != null) {
                await cloudinary.uploader.destroy(frontId);
            }

            const otherImage = data.postProperty[0].otherImage

            for (let i = 0; i < otherImage.length; i++) {

                const frontId = data.postProperty[0].otherImage[i].public_id;
                if (frontId != null) {
                    await cloudinary.uploader.destroy(frontId)
                }

            }


            const update = {
                $pull: {
                    postProperty: { _id: id }
                }
            };
            // Perform the update operation
            const result = await postPropertyModel.updateOne(update);
            // const result = await postPropertyModel.deleteOne({ 'postProperty._id': id });
            res.status(200).json({
                message: "delete",
                result
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "something went wrong "
            })
        }
    }
   
}
module.exports = PostPropertyController