const postPropertyModel = require("../../../models/postProperty/post")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer")
// const otpGenerator = require('otp-generator')
const cloudinary = require('cloudinary').v2;
const cache = require('memory-cache');

// Function to get all project data and cache it
const getAllProjects = async () => {
    try {
        const data = await postPropertyModel.find();
        cache.put('allProjects', data, 3600000); // Cache for 1 hour (in milliseconds)
    } catch (error) {
        console.error("Error caching projects:", error);
    }
};


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
        from: 'amit100acre@gmail.com', // Sender address
        to: email, // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
        subject: 'Password Reset',
        html: `
        <!DOCTYPE html>
        <html lang:"en>
        <head>
        <meta charset:"UTF-8">
        <meta http-equiv="X-UA-Compatible"  content="IE=edge">
        <meta name="viewport"  content="width=device-width, initial-scale=1.0">
        <title>Forget Password</title>
        </head>
        <body>
        <p>Dear User ,</p>
        <p>click the following link to reset the password :</p>
        <p>

        <a href="http://localhost:3000/resetpassword/${token}" target="_blank" rel="noopener noreferrer">Reset Your Password </a>
        </p>
        </p>

        <p>If you didn't request to password reset </p>

       <p>Best regrads ,
            <br>
       </p>

        </body>
        </html>
`
    });
}
const sendPostEmail = async (email) => {
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
        from: 'amit100acre@gmail.com', // Sender address
        to: 'amit100acre@gmail.com', // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
        subject: 'Post Property',
        html: `
        <!DOCTYPE html>
        <html lang:"en>
        <head>
        <meta charset:"UTF-8">
        <meta http-equiv="X-UA-Compatible"  content="IE=edge">
        <meta name="viewport"  content="width=device-width, initial-scale=1.0">
        <title>New Project Submission</title>
        </head>
        <body>
            <h1>New Project Submission</h1>
            <p>Hello,</p>
            <p>A new project has been submitted on your website by : ${email}</p>
            <p>Please review the details and take necessary actions.</p>
            <p>Thank you!</p>
        </body>
        </html>
`
    });

}

class PostPropertyController {
    // seller work Registration work    
    static postPerson_Register = async (req, res) => {
        try {
            const { name, email, mobile, password, cpassword } = req.body
            // console.log(req.body
            const verify = await postPropertyModel.findOne({ email: email })
            if (verify) {
                res.status(409).json({
                    message: " User already exists !"
                })
            }
            else {
                if (name && email && password && cpassword && mobile) {
                    if (password.length < 5) {
                        res.status(400).json({
                            message: " Password must be atleast 8 character ! "
                        })
                    } else {
                        if (password == cpassword) {
                            const hashpassword = await bcrypt.hash(password, 10)
                            const data = new postPropertyModel({
                                name: name,
                                email: email,
                                password: hashpassword,
                                mobile: mobile,
                            })
                            // console.log(data)
                            await data.save()
                            res.status(200).json({
                                message: "Registration successfully done ! "
                            })

                        } else {
                            res.status(401).json({
                                message: "Password and Confirm password does not match  ! "
                            })
                        }
                    }
                } else {
                    res.status(204).json({
                        message: "check yur field ! "
                    })
                }
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error !"
            })
        }
    }
    // verify login for seller
    static postPerson_VerifyLogin = async (req, res) => {
        try {
            const { email, password } = req.body
            if (email && password) {
                const User = await postPropertyModel.findOne({ email: email })
                // console.log(User.role,"hello")
                if (User != null) {
                    const isMatch = await bcrypt.compare(password, User.password)
                    if ((email == email) && isMatch) {
                        if (User.role == 'Seller') {
                            const token = jwt.sign({ user_id: User._id }, 'amitchaudhary100')
                            res.status(200).json({
                                message: " login successfully done  ! ",
                                token: token,

                            })
                        } else {
                            const token = jwt.sign({ user_id: User._id }, 'amitchaudhary100')
                            res.status(200).json({
                                message: " Admin login successfully done ! ",
                                token: token,

                            })
                        }
                    } else {
                        res.status(401).json({
                            message: "Please verify your email and password before sign in !"
                        })
                    }

                } else {
                    res.status(200).json({
                        message: "Registration is required before sign in ! "
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
    static postPerson_verifyRole = async (req, res) => {
        try {
            const email = req.params.email
            // console.log(req.params.email)
            if (email) {
                const User = await postPropertyModel.findOne({ email: email })
                if (User) {
                    res.status(200).json({
                        message: "user found ! ",
                        User: User
                    })
                } else {
                    res.status(200).json({
                        message: "user not found "
                    })
                }
            } else {
                res.status(200).json({
                    message: "please enter email !"
                })
            }
        } catch (error) {

        }
    }
    // logout
    static postPerson_logout = async (req, res) => {
        try {
            res.clearCookie('token')
            res.status(200).json({
                message: "You have successfully logged out !"
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    //forget password
    static postPerson_forget = async (req, res) => {
        const { email } = req.body
        try {
            if (email) {
                const user = await postPropertyModel.findOne({ email: email })
                // console.log(user)
                if (!user) {
                    res.status(404).json({
                        message: " User not found , sign in before login  ! "
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
                        message: "Password reset link sent successfully"
                    })
                }
            } else {
                res.status(403).json({
                    message: "Check your email ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error "
            })
        }
    }
    // Reset Password
    static postPerson_reset = async (req, res) => {
        try {

            const { token } = req.params
            const { password } = req.body
            if (token && password) {
                const hashpassword = await bcrypt.hash(password, 10)
                // console.log(hashpassword)
                const user = await postPropertyModel.findOneAndUpdate({ token: token }, ({
                    password: hashpassword,
                    token: "",
                }))
                if (user) {
                    // console.log(token, "here token is updated and set as empty token after running this api")
                    await user.save()
                    res.status(200).json({
                        message: "Your password has been updated successfuly ! ",
                        user: user.email
                    })
                } else {
                    res.status(200).json({
                        message: "Please provide registered email again ! "
                    })
                }
            } else {
                res.status(200).json({
                    message: "check your field  ! "
                })
            }
        }
        catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error"
            })
        }
    }
    //viewAll
    // static postPerson_View = async (req, res) => {
    //     // console.log("hello")
    //     try {
    //         const data = await postPropertyModel.find()
    //         res.status(200).json({
    //             message: "data get successfully ! ",
    //             data
    //         })


    //     } catch (error) {
    //         console.log(error)
    //         res.status(500).json({
    //             message: " Internal server error ! "
    //         })
    //     }
    // }
    static postPerson_View = async (req, res) => {
        try {
            const cachedData = cache.get('allProjects');
            if (cachedData) {
                return res.status(200).json({
                    message: "Data fetched from cache!",
                    data: cachedData
                });
            } else {
                // If data is not cached, fetch it and cache it
                await getAllProjects();
                const newData = cache.get('allProjects');
                return res.status(200).json({
                    message: "Data fetched and cached!",
                    data: newData
                });
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
            res.status(500).json({
                message: "Internal server error!"
            });
        }
    };
    // edit
    static postPerson_Edit = async (req, res) => {
        try {
            const id = req.params.id;
            if (id) {
                const data = await postPropertyModel.findById({ _id: id })
                if (data) {
                    res.status(200).json({
                        message: "Data retrieved successfully ! ",
                        data
                    })
                } else {
                    res.status(200).json({
                        message: " data not found  ! ",
                        data
                    })
                }
            } else {
                res.status(200).json({
                    message: " chrck id  ! ",
                    data
                })
            }
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
        try {
            const { name, email, address, mobile } = req.body
            if (req.body) {
                const data = await postPropertyModel.findByIdAndUpdate(req.params.id, {
                    name: name,
                    email: email,
                    address: address,
                    mobile: mobile

                })
                await data.save()
                res.status(200).json({
                    message: "updated successfully ! ",
                    data
                })
            } else {
                res.status(403).json({
                    message: "check field ! ",
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
    //change password 
    static Post_changePassword = async (req, res) => {
        try {

            const { email, password } = req.body
            if (email && password) {
                const hashpassword = await bcrypt.hash(password, 10)
                const data = await postPropertyModel.findOneAndUpdate({ email: email },
                    {
                        password: hashpassword
                    }
                )
                await data.save()
                res.status(200).json({
                    message: "Your password has been updated successfuly !"
                })
            } else {
                res.status(200).json({
                    message: "check your field ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    // delete account
    static postPerson_accountDelete = async (req, res) => {
        // console.log("hello")
        try {
            const id = req.params.id;

            const data = await postPropertyModel.findByIdAndDelete({ _id: id })
            if (data) {
                res.status(200).json({
                    message: "data deleted successfully !"
                })
            } else {
                res.status(410).json({
                    message: " Resource has already been deleted or not found !"
                })
            }
            // resource has already been deleted or not found
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! ",

            })
        }
    }
    // post property start here 
    // postproperty  data insert
    static postProperty = async (req, res) => {
        try {
            const { propertyName } = req.body
            if (req.files) {
                if (req.files.frontImage && req.files.otherImage) {
                    const id = req.params.id

                    const frontImage = req.files.frontImage;
                    const frontResult = await cloudinary.uploader.upload(
                        frontImage.tempFilePath, {
                        folder: `100acre/Postproperty/${propertyName}`
                    }
                    )
                    const otherImage = req.files.otherImage;
                    const otherImagelink = []
                    if (otherImage.length >= 2) {
                        for (let i = 0; i < otherImage.length; i++) {
                            const otherResult = await cloudinary.uploader.upload(
                                otherImage[i].tempFilePath, {
                                folder: `100acre/Postproperty/${propertyName}`
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
                            folder: `100acre/Postproperty/${propertyName}`
                        }
                        );
                        otherImagelink.push({
                            public_id: otherResult.public_id,
                            url: otherResult.secure_url
                        })

                    }

                    const personData = await postPropertyModel.findOne({ _id: id })
                    const email = personData.email;
                    const number = personData.mobile;
                    // console.log(email, number)

                    const data = {
                        propertyType: req.body.propertyType,
                        propertyName: req.body.propertyName,
                        address: req.body.address,
                        city: req.body.city,
                        state: req.body.state,
                        price: req.body.price,
                        area: req.body.area,
                        descripation: req.body.descripation,
                        landMark: req.body.landMark,
                        amenities: req.body.amenities,
                        builtYear: req.body.builtYear,
                        furnishing: req.body.furnishing,
                        type: req.body.type,
                        availableDate: req.body.availableDate,
                        email: email,
                        number: number,
                        verify: " ",
                        frontImage: {
                            public_id: frontResult.public_id,
                            url: frontResult.secure_url
                        },
                        otherImage: otherImagelink,
                        propertyLooking:req.body.propertyLooking
                    }
                    // console.log(data)

                    if (id) {

                        const dataPushed = await postPropertyModel.findOneAndUpdate(
                            { _id: id },
                            { $push: { postProperty: data } },
                            { new: true })

                        const email = dataPushed.email

                        // await sendPostEmail(email)
                        res.status(200).json({
                            message: "Data pushed successfully ! "
                        })
                    } else {
                        res.status(200).json({
                            message: "user id not found ! "
                        })
                    }
                } else if (req.files.frontImage) {

                    const id = req.params.id
                    const personData = await postPropertyModel.findOne({ _id: id })
                    const email = personData.email;
                    const number = personData.mobile;
                    const frontImage = req.files.frontImage;
                    const frontResult = await cloudinary.uploader.upload(
                        frontImage.tempFilePath, {
                        folder: `100acre/Postproperty/${propertyName}`
                    }
                    )
                    const data = {
                        propertyType: req.body.propertyType,
                        propertyName: req.body.propertyName,
                        address: req.body.address,
                        city: req.body.city,
                        state: req.body.state,
                        price: req.body.price,
                        area: req.body.area,
                        descripation: req.body.descripation,
                        landMark: req.body.landMark,
                        amenities: req.body.amenities,
                        builtYear: req.body.builtYear,
                        furnishing: req.body.furnishing,
                        type: req.body.type,
                        availableDate: req.body.availableDate,
                        frontImage: {
                            public_id: frontResult.public_id,
                            url: frontResult.secure_url
                        },
                        email: email,
                        number: number,
                        verify: '',
                        propertyLooking:req.body.propertyLooking
                    }
                    // console.log(data)

                    if (id) {

                        const dataPushed = await postPropertyModel.findOneAndUpdate(
                            { _id: id },
                            { $push: { postProperty: data } },
                            { new: true })

                        const email = dataPushed.email
                        console.log(email, "hello")
                        await sendPostEmail(email)
                        res.status(200).json({
                            message: "Data pushed successfully ! "
                        })
                    } else {
                        res.status(200).json({
                            message: "user id not found ! "
                        })
                    }

                } else if (req.files.otherImage) {
                    const id = req.params.id
                    const personData = await postPropertyModel.findOne({ _id: id })
                    const email = personData.email;
                    const number = personData.mobile;
                    const otherImage = req.files.otherImage;
                    const otherImagelink = []
                    if (otherImage.length >= 2) {
                        for (let i = 0; i < otherImage.length; i++) {
                            const otherResult = await cloudinary.uploader.upload(
                                otherImage[i].tempFilePath, {
                                folder: `100acre/Postproperty/${propertyName}`
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
                            folder: `100acre/Postproperty/${propertyName}`
                        }
                        );
                        otherImagelink.push({
                            public_id: otherResult.public_id,
                            url: otherResult.secure_url
                        })

                    }

                    const data = {
                        propertyType: req.body.propertyType,
                        propertyName: req.body.propertyName,
                        address: req.body.address,
                        city: req.body.city,
                        state: req.body.state,
                        price: req.body.price,
                        area: req.body.area,
                        descripation: req.body.descripation,
                        landMark: req.body.landMark,
                        amenities: req.body.amenities,
                        builtYear: req.body.builtYear,
                        furnishing: req.body.furnishing,
                        type: req.body.type,
                        availableDate: req.body.availableDate,

                        otherImage: otherImagelink,
                        email: email,
                        number: number,
                        verify: '',
                        propertyLooking:req.body.propertyLooking
                    }
                    // console.log(data)

                    if (id) {

                        const dataPushed = await postPropertyModel.findOneAndUpdate(
                            { _id: id },
                            { $push: { postProperty: data } },
                            { new: true })

                        const email = dataPushed.email
                        console.log(email, "hello")
                        // await sendPostEmail(email)
                        res.status(200).json({
                            message: "Data pushed successfully ! "
                        })
                    } else {
                        res.status(200).json({
                            message: "user id not found ! "
                        })
                    }
                }
            } else {
                const id = req.params.id
                const personData = await postPropertyModel.findOne({ _id: id })
                const email = personData.email;
                const number = personData.mobile;
                // console.log(email,number)
                const data = {
                    propertyType: req.body.propertyType,
                    propertyName: req.body.propertyName,
                    address: req.body.address,
                    city: req.body.city,
                    state: req.body.state,
                    price: req.body.price,
                    area: req.body.area,
                    descripation: req.body.descripation,
                    landMark: req.body.landMark,
                    amenities: req.body.amenities,
                    builtYear: req.body.builtYear,
                    furnishing: req.body.furnishing,
                    type: req.body.type,
                    availableDate: req.body.availableDate,
                    email: email,
                    number: number,
                    verify:"",
                    propertyLooking:req.body.propertyLooking

                }
                // console.log(data)

                if (id) {

                    const dataPushed = await postPropertyModel.findOneAndUpdate(
                        { _id: id },
                        { $push: { postProperty: data } },
                        { new: true })

                    const email = dataPushed.email
                    // console.log(email, "hello")
                    // await sendPostEmail(email)
                    res.status(200).json({
                        message: "Data pushed successfully ! "
                    })
                } else {
                    res.status(200).json({
                        message: "user id not found ! "
                    })
                }
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    // postproperty  data user wise  All view lks
    static postProperty_View = async (req, res) => {
        try {
            const id = req.params.id
            if (id) {
                const data = await postPropertyModel.findById({ _id: id })
                if (data) {
                    res.status(200).json({
                        message: "All project Data get  !",
                        data
                    })
                } else {
                    res.status(200).json({
                        message: " data not found !",

                    })
                }
            } else {
                res.status(200).json({
                    message: "Id not found  !",

                })
            }
        } catch (error) {
            res.status(500).json({
                message: "internal server error ! "
            })
        }

    }
    // postproperty data  view // here we use postproperty id 
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
            if (data) {
                res.status(200).json({
                    message: "data retrieved successfully ! ",
                    data
                })
            } else {
                res.status(200).json({
                    message: "data not found !"
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    //postproperty data edit 
    static postProperty_Edit = async (req, res) => {
        try {
            // console.log(req.params.id)
            const id = req.params.id

            const data = await postPropertyModel.findOne({ "postProperty._id": id }, {
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
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    // postproperty data upate 
    static postProperty_Update = async (req, res) => {
        try {
            const { propertyName, propertyType, address, area, city, state, price, descripation, furnishing, builtYear, type, amenities, landMark, availableDate,propertyLooking } = req.body
            if (req.files) {
                if (req.files.frontImage && req.files.otherImage) {
                    const frontImage = req.files.frontImage;
                    const otherImage = req.files.otherImage;
                    const otherImageLink = []

                    const id = req.params.id
                  
                    const frontResult = await cloudinary.uploader.upload(
                        frontImage.tempFilePath, {
                        folder: `100acre/Postproperty/${propertyName}`
                    }
                    )

                    if (otherImage.length >= 2) {
                        for (let i = 0; i < otherImage.length; i++) {
                            const otherResult = await cloudinary.uploader.upload(
                                otherImage[i].tempFilePath, {
                                folder: `100acre/Postproperty/${propertyName}`
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
                            folder: `100acre/Postproperty/${propertyName}`
                        }
                        );
                        otherImageLink.push({
                            public_id: otherResult.public_id,
                            url: otherResult.secure_url
                        })

                    }
                   
                    // console.log(otherImageLink)
                    const dataUpdate = await postPropertyModel.findOneAndUpdate(
                        { "postProperty._id": id },
                        {
                            $set: {
                                "postProperty.$.frontImage": {
                                    public_id: frontResult.public_id,
                                    url: frontResult.secure_url
                                },
                                "postProperty.$.otherImage":otherImageLink,
                                "postProperty.$.propertyName": propertyName,
                                "postProperty.$.propertyType": propertyType,
                                "postProperty.$.area": area,
                                "postProperty.$.city": city,
                                "postProperty.$.state": state,
                                "postProperty.$.address": address,
                                "postProperty.$.availabledate": availableDate,
                                "postProperty.$.price": price,
                                "postProperty.$.descripation": descripation,
                                "postProperty.$.furnishing": furnishing,
                                "postProperty.$.builtYear": builtYear,
                                "postProperty.$.landMark": landMark,
                                "postProperty.$.type": type,
                                "postProperty.$.amenities": amenities,
                                "postProperty.$.propertyLooking": propertyLooking
                            }
                        },
                        { new: true }
                    );
                    res.status(200).json({
                        message: "postProperty successfully update ! ",
                        dataUpdate
                    })

                } else if (req.files.frontImage) {
                    // res.send("front image")
                    const frontImage = req.files.frontImage;

                    const id = req.params.id;

                    const frontResult = await cloudinary.uploader.upload(
                        frontImage.tempFilePath,
                        { folder: `100acre/Postproperty/${propertyName}` }
                    )

                    // console.log(update)
                    const dataUpdate = await postPropertyModel.findOneAndUpdate(
                        { "postProperty._id": id },
                        {
                            $set: {
                                "postProperty.$.frontImage": {
                                    public_id: frontResult.public_id,
                                    url: frontResult.secure_url
                                },
                                "postProperty.$.propertyName": propertyName,
                                "postProperty.$.propertyType": propertyType,
                                "postProperty.$.area": area,
                                "postProperty.$.city": city,
                                "postProperty.$.state": state,
                                "postProperty.$.address": address,
                                "postProperty.$.availabledate": availableDate,
                                "postProperty.$.price": price,
                                "postProperty.$.descripation": descripation,
                                "postProperty.$.furnishing": furnishing,
                                "postProperty.$.builtYear": builtYear,
                                "postProperty.$.landMark": landMark,
                                "postProperty.$.type": type,
                                "postProperty.$.amenities": amenities,
                                "postProperty.$.propertyLooking": propertyLooking
                            }
                        },
                        { new: true }
                    );
                    // res.send(dataUpdate)
                    res.status(200).json({
                        message: "data updated",
                        dataUpdate
                    })
                } else if (req.files.otherImage) {
                    // res.send("listn other")
                    const otherImage = req.files.otherImage;
                    const id = req.params.id;
                  
                    const otherImageLink = []
                    if (otherImage.length >= 2) {
                        for (let i = 0; i < otherImage.length; i++) {
                            const otherResult = await cloudinary.uploader.upload(
                                otherImage[i].tempFilePath,
                                {
                                    folder: `100acre/Postproperty/${propertyName}`
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
                                folder: `100acre/Postproperty/${propertyName}`
                            }
                        )
                        otherImageLink.push({
                            public_id: otherResult.public_id,
                            url: otherResult.secure_url
                        })
                    }
                    // console.log(update)
                    const dataUpdate = await postPropertyModel.findOneAndUpdate(
                        { "postProperty._id": id },
                        {
                            $set: {
                                "postProperty.$.otherImage": otherImageLink,
                                "postProperty.$.propertyName": propertyName,
                                "postProperty.$.propertyType": propertyType,
                                "postProperty.$.area": area,
                                "postProperty.$.city": city,
                                "postProperty.$.state": state,
                                "postProperty.$.address": address,
                                "postProperty.$.availabledate": availableDate,
                                "postProperty.$.price": price,
                                "postProperty.$.descripation": descripation,
                                "postProperty.$.furnishing": furnishing,
                                "postProperty.$.builtYear": builtYear,
                                "postProperty.$.landMark": landMark,
                                "postProperty.$.type": type,
                                "postProperty.$.amenities": amenities,
                                "postProperty.$.propertyLooking": propertyLooking
                            }
                        },
                        { new: true }
                    );
                    
                    res.status(200).json({
                        message: "Data updated successfully!",
                        dataUpdate
                    });
                    

                }
            } else {
                const id = req.params.id;
               
                // console.log(update)
                const dataUpdate = await postPropertyModel.findOneAndUpdate(
                    { "postProperty._id": id },
                    {
                        $set: {
                            "postProperty.$.propertyName": propertyName,
                            "postProperty.$.propertyType": propertyType,
                            "postProperty.$.area": area,
                            "postProperty.$.city": city,
                            "postProperty.$.state": state,
                            "postProperty.$.address": address,
                            "postProperty.$.availabledate": availableDate,
                            "postProperty.$.price": price,
                            "postProperty.$.descripation": descripation,
                            "postProperty.$.furnishing": furnishing,
                            "postProperty.$.builtYear": builtYear,
                            "postProperty.$.landMark": landMark,
                            "postProperty.$.type": type,
                            "postProperty.$.amenities": amenities,
                            "postProperty.$.propertyLooking": propertyLooking
                        }
                    },
                    { new: true }
                );
                res.status(200).json({
                    message: "updated successfully ! ",
                    dataUpdate
                })

            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! ",

            })
        }
    }
    // postproperty delete
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
                message: "Internal server error ! "
            })
        }
    }
}
module.exports = PostPropertyController