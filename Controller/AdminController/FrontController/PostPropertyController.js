const postPropertyModel = require("../../../models/postProperty/post");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
// const otpGenerator = require('otp-generator')
const cloudinary = require("cloudinary").v2;
const cache = require("memory-cache");
const postEnquiryModel = require("../../../models/postProperty/enquiry");
const Email_verify = require("../../../models/postProperty/emailVerify");
const mongoose = require("mongoose");

require('dotenv').config()
const fs=require('fs');
const AWS=require('aws-sdk');
const { isValidObjectId } = require('mongoose');
AWS.config.update({
    secretAccessKey: process.env.AWS_S3_SECRET_ACESS_KEY,
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    region: process.env.AWS_REGION,
})
const s3=new AWS.S3()
const uploadFile=(file)=>{

  const fileContent=fs.readFileSync(file.path)

  const params={
      Bucket:"100acress-media-bucket",
      Body:fileContent,
      Key:`uploads/${Date.now()}-${file.originalname}`,
      ContentType:file.mimetype

  }
  return s3.upload(params).promise();

}

// Function to get all project data and cache it
const getAllProjects = async () => {
  try {
    const data = await postPropertyModel.find();
    cache.put("allProjects", data, 3600000); // Cache for 1 hour (in milliseconds)
  } catch (error) {
    console.error("Error caching projects:", error);
  }
};
const generateToken = () => {
  return Math.floor(Math.random() * 1000000);
};
const transporter =  nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  logger: false,
  debug: true,
  secureConnection: false,
  auth: {
    // user: process.env.Email,
    // pass: process.env.EmailPass
    user: "web.100acress@gmail.com",
    pass: "txww gexw wwpy vvda",
  },
  tls: {
    rejectUnAuthorized: true,
  },
});
const sendResetEmail = async (email, token) => {
  // Connect with SMTP Gmail
  const transporter = await nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    logger: false,
    debug: true,
    secureConnection: false,
    auth: {
      // user: process.env.Email,
      // pass: process.env.EmailPass
      user: "web.100acress@gmail.com",
      pass: "txww gexw wwpy vvda",
    },
    tls: {
      rejectUnAuthorized: true,
    },
  });
  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: "amit100acre@gmail.com", // Sender address
    to: email, // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
    subject: "Password Reset",
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

        <a href="https://100acress.com/resetpassword/${token}" target="_blank" rel="noopener noreferrer">Reset Your Password </a>
        </p>
        </p>

        <p>If you didn't request to password reset </p>

       <p>Best regrads ,
            <br>
       </p>

        </body>
        </html>
`,
  });
};
const sendPostEmail = async (email) => {
  const transporter = await nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    logger: false,
    debug: true,
    secureConnection: false,
    auth: {
      // user: process.env.Email,
      // pass: process.env.EmailPass
      user: "web.100acress@gmail.com",
      pass: "txww gexw wwpy vvda",
    },
    tls: {
      rejectUnAuthorized: true,
    },
  });
  // Send mail with defined transport objec
  let info = await transporter.sendMail({
    from: "amit100acre@gmail.com", // Sender address
    to: "web.100acress@gmail.com", // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
    subject: "Post Property",
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
`,
  });
    let info = await transporter.sendMail({
    from: "amit100acre@gmail.com", // Sender address
    to: email, // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
    subject: "Post Property",
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
`,
  });
};
class PostPropertyController {
  // seller work Registration
  // static postPerson_Register = async (req, res) => {
  //   try {
  //     const { name, email, mobile, password, cpassword, role } = req.body;
  //     // console.log(req.body
  //     const verify = await postPropertyModel.findOne({ email: email });
  //     if (verify) {
  //       res.status(409).json({
  //         message: " User already exists !",
  //       });
  //     } else {
  //       if (name && email && password && cpassword && mobile && role) {
  //         if (password.length < 5) {
  //           res.status(400).json({
  //             message: " Password must be atleast 8 character ! ",
  //           });
  //         } else {
  //           if (password == cpassword) {
  //             const hashpassword = await bcrypt.hash(password, 10);
  //             const data = new postPropertyModel({
  //               name: name,
  //               email: email,
  //               password: hashpassword,
  //               mobile: mobile,
  //               role: role,
  //             });
  //             // console.log(data)
  //             await data.save();
  //             res.status(200).json({
  //               message: "Registration successfully done ! ",
  //             });
  //           } else {
  //             res.status(401).json({
  //               message: "Password and Confirm password does not match  ! ",
  //             });
  //           }
  //         }
  //       } else {
  //         res.status(204).json({
  //           message: "check yur field ! ",
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     res.status(500).json({
  //       message: "Internal server error !",
  //     });
  //   }
  // };
  static postPerson_Register = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { name, email, mobile, password, cpassword, role } = req.body;

      const verify = await postPropertyModel
        .findOne({ email: email })
        .session(session);
      console.log(verify);

      if (verify) {
        res.status(409).json({
          message: "User already exists!",
        });
        await session.abortTransaction();
        session.endSession();
        return;
      }

      if (!name || !email || !password || !cpassword || !mobile || !role) {
        res.status(400).json({
          message: "Please fill in all fields!",
        });
        await session.abortTransaction();
        session.endSession();
        return;
      }

      if (password.length < 5) {
        res.status(400).json({
          message: "Password must be at least 8 characters!",
        });
        await session.abortTransaction();
        session.endSession();
        return;
      }

      if (password !== cpassword) {
        res.status(400).json({
          message: "Password and Confirm Password do not match!",
        });
        await session.abortTransaction();
        session.endSession();
        return;
      }

      const hashpassword = await bcrypt.hash(password, 10);
      const data = new postPropertyModel({
        name: name,
        email: email,
        password: hashpassword,
        mobile: mobile,
        role: role,
      });
      await data.save({ session });
      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        message: "Registration successfully done!",
      });
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();
      res.status(500).json({
        message: "Internal server error!",
      });
    }
  };
  // verify login for seller
  static postPerson_VerifyLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (email && password) {
        const User = await postPropertyModel.findOne({ email: email });
        // console.log(User.role,"hello")
        if (User != null) {
          const isMatch = await bcrypt.compare(password, User.password);
          if (email == email && isMatch) {
            if (User.role == "admin") {
              const token = jwt.sign({ user_id: User._id }, "amitchaudhary100");

              res.status(200).json({
                message: " Admin login successfully ! ",
                token,
                User,
              });
            } else {
              const token = jwt.sign({ user_id: User._id }, "amitchaudhary100");
              // const totalProperty=User.postProperty.length
              // const Property = User.postProperty;
              // const SellProperty = Property.filter(property => property.propertyLooking == "Sell");
              // const selltotal=SellProperty.length
              // const RentProperty = Property.filter(property => property.propertyLooking === "rent");
              // const Renttotal=RentProperty.length

              res.status(200).json({
                message: " login successfully done  ! ",
                token,
                User,
              });
            }
          } else {
            res.status(401).json({
              message: "Please verify your email and password before sign in !",
            });
          }
        } else {
          res.status(200).json({
            message: "Registration is required before sign in ! ",
          });
        }
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  static postPerson_verifyRole = async (req, res) => {
    try {
      const email = req.params.email;
      // console.log(req.params.email)
      if (email) {
        const User = await postPropertyModel.findOne({ email: email });
        if (User) {
          res.status(200).json({
            message: "user found ! ",
            User: User,
          });
        } else {
          res.status(200).json({
            message: "user not found ",
          });
        }
      } else {
        res.status(200).json({
          message: "please enter email !",
        });
      }
    } catch (error) {}
  };
  // logout
  static postPerson_logout = async (req, res) => {
    try {
      res.clearCookie("token");
      res.status(200).json({
        message: "You have successfully logged out !",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  //forget password
  static postPerson_forget = async (req, res) => {
    const { email } = req.body;
    console.log(email)
    try {
      if (email) {
        const user = await postPropertyModel.findOne({ email: email });
        console.log(user)
        if (!user) {
          res.status(404).json({
            message: " User not found , sign in before login  ! ",
          });
        } else {
          console.log("token")
          const token = generateToken();
          console.log("token1")
          const resetToken = await postPropertyModel.findByIdAndUpdate(
            user._id,
            {
              token: token,
            }
          );
          console.log(token,resetToken,"fhwe")
          await resetToken.save();
          await sendResetEmail(email, token);
           console.log(resetToken,"lhfuiweh")
          res.status(200).json({
            message: "Password reset link sent successfully",
          });
        }
      } else {
        res.status(403).json({
          message: "Check your email ! ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ",
      });
    }
  };
  // Reset Password
  static postPerson_reset = async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      if (token && password) {
        const hashpassword = await bcrypt.hash(password, 10);
        // console.log(hashpassword)
        const user = await postPropertyModel.findOneAndUpdate(
          { token: token },
          {
            password: hashpassword,
            token: "",
          }
        );
        if (user) {
          // console.log(token, "here token is updated and set as empty token after running this api")
          await user.save();
          res.status(200).json({
            message: "Your password has been updated successfuly ! ",
            user: user.email,
          });
        } else {
          res.status(200).json({
            message: "Please provide registered email again ! ",
          });
        }
      } else {
        res.status(200).json({
          message: "check your field  ! ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  };
  // viewAll
  static postPerson_View = async (req, res) => {
    try {
      // Check cache first
      const cachedData = cache.get("allUser");
      if (cachedData) {
        return res.status(200).json({
          message: "Data from cache",
          data: cachedData,
        });
      }
      // If cache is empty, fetch from database
      const data = await postPropertyModel.find();
      // Cache the data with an expiration time of 5 minutes
      const expirationTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      cache.put("allUser", data, expirationTime);

      return res.status(200).json({
        message: "Data fetched successfully",
        data,
      });
    } catch (error) {
      console.error("Error fetching data:", error); // Better logging
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  };
  // static postPerson_View = async (req, res) => {
  //     try {
  //         const cachedData = cache.get('allProjects');
  //         if (cachedData) {
  //             return res.status(200).json({
  //                 message: "Data fetched from cache!",
  //                 data: cachedData
  //             });
  //         } else {
  //             // If data is not cached, fetch it and cache it
  //             await getAllProjects();
  //             const newData = cache.get('allProjects');
  //             return res.status(200).json({
  //                 message: "Data fetched and cached!",
  //                 data: newData
  //             });
  //         }
  //     } catch (error) {
  //         console.error("Error fetching projects:", error);
  //         res.status(500).json({
  //             message: "Internal server error!"
  //         });
  //     }
  // };
  // edit
  static postPerson_Edit = async (req, res) => {
    try {
      const id = req.params.id;
      if (id) {
        const data = await postPropertyModel.findById({ _id: id });
        if (data) {
          res.status(200).json({
            message: "Data retrieved successfully ! ",
            data,
          });
        } else {
          res.status(200).json({
            message: " data not found  ! ",
            data,
          });
        }
      } else {
        res.status(200).json({
          message: " chrck id  ! ",
          data,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };
  // update 
  static postPerson_update = async (req, res) => {
    // console.log("hello")
    try {
      const { name, email, address, mobile } = req.body;
      if (req.body) {
        const data = await postPropertyModel.findByIdAndUpdate(req.params.id, {
          name: name,
          email: email,
          address: address,
          mobile: mobile,
        });
        await data.save();
        res.status(200).json({
          message: "updated successfully ! ",
          data,
        });
      } else {
        res.status(403).json({
          message: "check field ! ",
          data,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  //change password
  static Post_changePassword = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (email && password) {
        const hashpassword = await bcrypt.hash(password, 10);
        const data = await postPropertyModel.findOneAndUpdate(
          { email: email },
          {
            password: hashpassword,
          }
        );
        await data.save();
        res.status(200).json({
          message: "Your password has been updated successfuly !",
        });
      } else {
        res.status(200).json({
          message: "check your field ! ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // delete account
  static postPerson_accountDelete = async (req, res) => {
    // console.log("hello")
    try {
      const id = req.params.id;

      const data = await postPropertyModel.findByIdAndDelete({ _id: id });
      if (data) {
        res.status(200).json({
          message: "data deleted successfully !",
        });
      } else {
        res.status(410).json({
          message: " Resource has already been deleted or not found !",
        });
      }
      // resource has already been deleted or not found
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // post property start here
  // postproperty  data insert
  // acc-s3
  static postProperty = async (req, res) => {
    try {
        if (req.files.frontImage && req.files.otherImage) {
          const id = req.params.id;
          const personData = await postPropertyModel.findById({ _id: id });
          const email = personData.email;
          const number = personData.mobile;
          const agentName = personData.name;
          const role = personData.role;
        let frontImage=await uploadFile(req.files.frontImage[0]);
        let otherImage=await Promise.all(
          req.files.otherImage.map((file)=>
          uploadFile(file))
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
            email: email,
            number: number,
            verify: " ",
            agentName: agentName,
            role: role,
            frontImage: {
              public_id:frontImage.Key,
              url:frontImage.Location,
            },
            otherImage:otherImage.map((file)=>({
              public_id:file.Key,
              url:file.Location
            })),
            propertyLooking: req.body.propertyLooking,
          };
          // console.log(data)

          if (id) {
            const dataPushed = await postPropertyModel.findOneAndUpdate(
              { _id: id },
              { $push: { postProperty: data } },
              { new: true }
            );

            const email = dataPushed.email;

            await sendPostEmail(email);
            res.status(200).json({
              message: "Data pushed successfully ! ",
            });
          } else {
            res.status(200).json({
              message: "user id not found ! ",
            });
          }
        } else if (req.files.frontImage) {
          const id = req.params.id;
          const personData = await postPropertyModel.findOne({ _id: id });
          const email = personData.email;
          const number = personData.mobile;
          const agentName = personData.name;
          const role = personData.role;
  
      const frontImage=await uploadFile(req.files.frontImage[0])

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
              public_id: frontImage.Key,
              url:frontImage.Key ,
            },
            email: email,
            number: number,
            agentName: agentName,
            role: role,
            verify: "",
            propertyLooking: req.body.propertyLooking,
          };
          // console.log(data)

          if (id) {
            const dataPushed = await postPropertyModel.findOneAndUpdate(
              { _id: id },
              { $push: { postProperty: data } },
              { new: true }
            );

            const email = dataPushed.email;

            await sendPostEmail(email);
            res.status(200).json({
              message: "Data pushed successfully ! ",
            });
          } else {
            res.status(200).json({
              message: "user id not found ! ",
            });
          }
        } else {
          const id = req.params.id;
          const personData = await postPropertyModel.findOne({ _id: id });
          const email = personData.email;
          const number = personData.mobile;
          const agentName = personData.name;
          const role = personData.role;

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
            agentName: agentName,
            role: role,
            verify: "",
            propertyLooking: req.body.propertyLooking,
          };
          // console.log(data)

          if (id) {
            const dataPushed = await postPropertyModel.findOneAndUpdate(
              { _id: id },
              { $push: { postProperty: data } },
              { new: true }
            );

            const email = dataPushed.email;
            // console.log(email, "hello")
            await sendPostEmail(email);
            res.status(200).json({
              message: "Data pushed successfully ! ",
            });
          } else {
            res.status(200).json({
              message: "user id not found ! ",
            });
          }
        }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // postproperty  data user wise  All view lks
  static postProperty_View = async (req, res) => {
    try {
      const id = req.params.id;
      const data = await postPropertyModel.findById({ _id: id });
      if (data) {
        res.status(200).json({
          message: "All project Data get  !",
          data,
        });
      } else {
        res.status(200).json({
          message: " data not found !",
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };
  // postproperty data  view // here we use postproperty id
  static postPropertyOne_View = async (req, res) => {
    try {
      // console.log("one view")
      const id = req.params.id;
      const data = await postPropertyModel.findOne(
        { "postProperty._id": id },
        {
          postProperty: {
            $elemMatch: {
              _id: id,
            },
          },
        }
      );
      if (data) {
        res.status(200).json({
          message: "data retrieved successfully ! ",
          data,
        });
      } else {
        res.status(200).json({
          message: "data not found !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  //postproperty data edit
  static postProperty_Edit = async (req, res) => {
    try {
      // console.log(req.params.id)
      const id = req.params.id;

      const data = await postPropertyModel.findOne(
        { "postProperty._id": id },
        {
          postProperty: {
            $elemMatch: {
              _id: id,
            },
          },
        }
      );
      // console.log(data)
      res.status(200).json({
        message: "data get Successsfully ! ",
        data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // postproperty data upate
  static postProperty_Update = async (req, res) => {
    try {
      const {
        propertyName,
        propertyType,
        address,
        area,
        city,
        state,
        price,
        descripation,
        furnishing,
        builtYear,
        type,
        amenities,
        landMark,
        availableDate,
        propertyLooking,
        verify,
      } = req.body;
      if (req.files) {
        if (req.files.frontImage && req.files.otherImage) {
          const frontImage = req.files.frontImage;
          const otherImage = req.files.otherImage;
          const otherImageLink = [];

          const id = req.params.id;

          const frontResult = await cloudinary.uploader.upload(
            frontImage.tempFilePath,
            {
              folder: "100acre/Postproperty",
            }
          );

          if (otherImage.length >= 2) {
            for (let i = 0; i < otherImage.length; i++) {
              const otherResult = await cloudinary.uploader.upload(
                otherImage[i].tempFilePath,
                {
                  folder: "100acre/Postproperty",
                }
              );
              otherImageLink.push({
                public_id: otherResult.public_id,
                url: otherResult.secure_url,
              });
            }
          } else {
            const otherResult = await cloudinary.uploader.upload(
              otherImage.tempFilePath,
              {
                folder: "100acre/Postproperty",
              }
            );
            otherImageLink.push({
              public_id: otherResult.public_id,
              url: otherResult.secure_url,
            });
          }

          // console.log(otherImageLink)
          const dataUpdate = await postPropertyModel.findOneAndUpdate(
            { "postProperty._id": id },
            {
              $set: {
                "postProperty.$.frontImage": {
                  public_id: frontResult.public_id,
                  url: frontResult.secure_url,
                },
                "postProperty.$.otherImage": otherImageLink,
                "postProperty.$.propertyName": propertyName,
                "postProperty.$.propertyType": propertyType,
                "postProperty.$.area": area,
                "postProperty.$.city": city,
                "postProperty.$.state": state,
                "postProperty.$.address": address,
                "postProperty.$.availableDate": availableDate,
                "postProperty.$.price": price,
                "postProperty.$.descripation": descripation,
                "postProperty.$.furnishing": furnishing,
                "postProperty.$.builtYear": builtYear,
                "postProperty.$.landMark": landMark,
                "postProperty.$.type": type,
                "postProperty.$.amenities": amenities,
                "postProperty.$.propertyLooking": propertyLooking,
                "postProperty.$.verify": verify,
              },
            },
            { new: true }
          );
          const agentEmail = dataUpdate.email;

          if (
            (propertyLooking, address, propertyName, agentEmail, dataUpdate)
          ) {
            const propertyName = dataUpdate.postProperty[0].propertyName;
            const address = dataUpdate.postProperty[0].address;
            if (verify) {
              const transporter = await nodemailer.createTransport({
                service: "gmail",
                port: 465,
                secure: true,
                logger: false,
                debug: true,
                secureConnection: false,
                auth: {
                  // user: process.env.Email,
                  // pass: process.env.EmailPass
                  user: "web.100acress@gmail.com",
                  pass: "txww gexw wwpy vvda",
                },
                tls: {
                  rejectUnAuthorized: true,
                },
              });
              // Send mail with defined transport objec
              let info = await transporter.sendMail({
                from: "amit100acre@gmail.com", // Sender address
                to: agentEmail, // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
                subject: "Verified Your Property",
                html: `
                                <!DOCTYPE html>
                                <html lang:"en>
                                <head>
                                <meta charset:"UTF-8">
                                <meta http-equiv="X-UA-Compatible"  content="IE=edge">
                                <meta name="viewport"  content="width=device-width, initial-scale=1.0">
                                <title>Congratulations! Your Property Verified  </title>
                                </head>
                                <body>
                               <p> Congratulations! Your property,${propertyName} address ${address} , has been successfully verified. 
                                The verification was conducted by 100acress team </p>
                                  
                                    <p>Please review the details : <a href="http://www.100acress.com">100acress.com</a>
                                    </p>
                                    <p>Thank you!</p>
                                </body>
                                </html>
                        `,
              });
            }
          }

          res.status(200).json({
            message: "postProperty successfully update ! ",
          });
        } else if (req.files.frontImage) {
          // res.send("front image")
          const frontImage = req.files.frontImage;

          const id = req.params.id;

          const frontResult = await cloudinary.uploader.upload(
            frontImage.tempFilePath,
            { folder: "100acre/Postproperty" }
          );

          // console.log(update)
          const dataUpdate = await postPropertyModel.findOneAndUpdate(
            { "postProperty._id": id },
            {
              $set: {
                "postProperty.$.frontImage": {
                  public_id: frontResult.public_id,
                  url: frontResult.secure_url,
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
                "postProperty.$.propertyLooking": propertyLooking,
                "postProperty.$.verify": verify,
              },
            },
            { new: true }
          );
          // res.send(dataUpdate)
          const agentEmail = dataUpdate.email;

          if (
            (propertyLooking, address, propertyName, agentEmail, dataUpdate)
          ) {
            const propertyName = dataUpdate.postProperty[0].propertyName;
            const address = dataUpdate.postProperty[0].address;
            if (verify) {
              const transporter = await nodemailer.createTransport({
                service: "gmail",
                port: 465,
                secure: true,
                logger: false,
                debug: true,
                secureConnection: false,
                auth: {
                  // user: process.env.Email,
                  // pass: process.env.EmailPass
                  user: "web.100acress@gmail.com",
                  pass: "txww gexw wwpy vvda",
                },
                tls: {
                  rejectUnAuthorized: true,
                },
              });
              // Send mail with defined transport objec
              let info = await transporter.sendMail({
                from: "amit100acre@gmail.com", // Sender address
                to: agentEmail, // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
                subject: "Verified Your Property",
                html: `
                                <!DOCTYPE html>
                                <html lang:"en>
                                <head>
                                <meta charset:"UTF-8">
                                <meta http-equiv="X-UA-Compatible"  content="IE=edge">
                                <meta name="viewport"  content="width=device-width, initial-scale=1.0">
                                <title>Congratulations! Your Property Verified  </title>
                                </head>
                                <body>
                               <p> Congratulations! Your property,${propertyName} address ${address} , has been successfully verified. 
                                The verification was conducted by 100acress team </p>
                                  
                                    <p>Please review the details : <a href="http://www.100acress.com">100acress.com</a>
                                    </p>
                                    <p>Thank you!</p>
                                </body>
                                </html>
                        `,
              });
            }
          }

          res.status(200).json({
            message: "data updated",
          });
        } else if (req.files.otherImage) {
          // res.send("listn other")
          const otherImage = req.files.otherImage;
          const id = req.params.id;

          const otherImageLink = [];
          if (otherImage.length >= 2) {
            for (let i = 0; i < otherImage.length; i++) {
              const otherResult = await cloudinary.uploader.upload(
                otherImage[i].tempFilePath,
                {
                  folder: "100acre/Postproperty",
                }
              );
              otherImageLink.push({
                public_id: otherResult.public_id,
                url: otherResult.secure_url,
              });
            }
          } else {
            const otherResult = await cloudinary.uploader.upload(
              otherImage.tempFilePath,
              {
                folder: "100acre/Postproperty",
              }
            );
            otherImageLink.push({
              public_id: otherResult.public_id,
              url: otherResult.secure_url,
            });
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
                "postProperty.$.availableDate": availableDate,
                "postProperty.$.price": price,
                "postProperty.$.descripation": descripation,
                "postProperty.$.furnishing": furnishing,
                "postProperty.$.builtYear": builtYear,
                "postProperty.$.landMark": landMark,
                "postProperty.$.type": type,
                "postProperty.$.amenities": amenities,
                "postProperty.$.propertyLooking": propertyLooking,
                "postProperty.$.verify": verify,
              },
            },
            { new: true }
          );
          const agentEmail = dataUpdate.email;

          if (
            (propertyLooking, address, propertyName, agentEmail, dataUpdate)
          ) {
            const propertyName = dataUpdate.postProperty[0].propertyName;
            const address = dataUpdate.postProperty[0].address;
            if (verify) {
              const transporter = await nodemailer.createTransport({
                service: "gmail",
                port: 465,
                secure: true,
                logger: false,
                debug: true,
                secureConnection: false,
                auth: {
                  // user: process.env.Email,
                  // pass: process.env.EmailPass
                  user: "web.100acress@gmail.com",
                  pass: "txww gexw wwpy vvda",
                },
                tls: {
                  rejectUnAuthorized: true,
                },
              });
              // Send mail with defined transport objec
              let info = await transporter.sendMail({
                from: "amit100acre@gmail.com", // Sender address
                to: agentEmail, // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
                subject: "Verified Your Property",
                html: `
                                <!DOCTYPE html>
                                <html lang:"en>
                                <head>
                                <meta charset:"UTF-8">
                                <meta http-equiv="X-UA-Compatible"  content="IE=edge">
                                <meta name="viewport"  content="width=device-width, initial-scale=1.0">
                                <title>Congratulations! Your Property Verified  </title>
                                </head>
                                <body>
                               <p> Congratulations! Your property,${propertyName} address ${address} , has been successfully verified. 
                                The verification was conducted by 100acress team </p>
                                  
                                    <p>Please review the details : <a href="http://www.100acress.com">100acress.com</a>
                                    </p>
                                    <p>Thank you!</p>
                                </body>
                                </html>
                        `,
              });
            }
          }

          res.status(200).json({
            message: "Data updated successfully!",
          });
        }
      } else {
        const id = req.params.id;
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
              "postProperty.$.availableDate": availableDate,
              "postProperty.$.price": price,
              "postProperty.$.descripation": descripation,
              "postProperty.$.furnishing": furnishing,
              "postProperty.$.builtYear": builtYear,
              "postProperty.$.landMark": landMark,
              "postProperty.$.type": type,
              "postProperty.$.amenities": amenities,
              "postProperty.$.propertyLooking": propertyLooking,
              "postProperty.$.verify": verify,
            },
          },
          { new: true }
        );

        const agentEmail = dataUpdate.email;

        if ((propertyLooking, address, propertyName, agentEmail, dataUpdate)) {
          const propertyName = dataUpdate.postProperty[0].propertyName;
          const address = dataUpdate.postProperty[0].address;
          if (verify) {
            const transporter = await nodemailer.createTransport({
              service: "gmail",
              port: 465,
              secure: true,
              logger: false,
              debug: true,
              secureConnection: false,
              auth: {
                // user: process.env.Email,
                // pass: process.env.EmailPass
                user: "web.100acress@gmail.com",
                pass: "txww gexw wwpy vvda",
              },
              tls: {
                rejectUnAuthorized: true,
              },
            });
            // Send mail with defined transport objec
            let info = await transporter.sendMail({
              from: "amit100acre@gmail.com", // Sender address
              to: agentEmail, // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
              subject: "Verified Your Property",
              html: `
                            <!DOCTYPE html>
                            <html lang:"en>
                            <head>
                            <meta charset:"UTF-8">
                            <meta http-equiv="X-UA-Compatible"  content="IE=edge">
                            <meta name="viewport"  content="width=device-width, initial-scale=1.0">
                            <title>Congratulations! Your Property Verified  </title>
                            </head>
                            <body>
                           <p> Congratulations! Your property,${propertyName} address ${address} , has been successfully verified. 
                            The verification was conducted by 100acress team </p>
                              
                                <p>Please review the details : <a href="http://www.100acress.com">100acress.com</a>
                                </p>
                                <p>Thank you!</p>
                            </body>
                            </html>
                    `,
            });
          }
        }

        res.status(200).json({
          message: "updated successfully ! ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };

  // postproperty delete
  static postProperty_Delete = async (req, res) => {
    try {
      const propertyId = req.params.id;
      // Find the user by ID
      const user = await postPropertyModel.findOne({
        "postProperty._id": propertyId,
      });

      const matchedPostProperties = user.postProperty.find(
        (postProperty) => postProperty._id.toString() === propertyId
      );
      const frontId = matchedPostProperties.frontImage.public_id;
      if (frontId) {
        await cloudinary.uploader.destroy(frontId);
      }
      const other = matchedPostProperties.otherImage;
      if (other) {
        for (let i = 0; i < other.length; i++) {
          const id = matchedPostProperties.otherImage[i].public_id;
          if (id) {
            await cloudinary.uploader.destroy(id);
          }
        }
      }

      if (!user) {
        return res.status(404).json({ error: "Post property not found" });
      }
      // Find  index of the postProperty object with  ID
      const index = user.postProperty.findIndex(
        (postProperty) => postProperty._id.toString() === propertyId
      );
      if (index === -1) {
        return res.status(404).json({ error: "Post property not found" });
      }
      user.postProperty.splice(index, 1);
      await user.save();
      res.status(200).json({ message: "Post property deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  static postPropertyEnquiry = async (req, res) => {
    try {
      const {agentEmail, agentNumber, custName, custEmail, custNumber, propertyAddress,} = req.body;
      if (req.body) {
        res.status(200).json({
          message: "data sent successfully ! ",
        });
        const data = new postEnquiryModel({
          agentEmail: agentEmail,
          agentNumber: agentNumber,
          custName: custName,
          custEmail: custEmail,
          custNumber: custNumber,
          propertyAddress: propertyAddress,
        });
        const info = await transporter.sendMail({
          from: "amit100acre@gmail.com", // Sender address
          to: "vinay.aadharhomes@gmail.com",
          // to:'amit100acre@gmail.com', // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
           subject: "Post Property",
          html: `
                      <!DOCTYPE html>
                      <html lang:"en>
                      <head>
                      <meta charset:"UTF-8">
                      <meta http-equiv="X-UA-Compatible"  content="IE=edge">
                      <meta name="viewport"  content="width=device-width, initial-scale=1.0">
                      <title>New Inquiry on Post-Property </title>
                      </head>
                      <body>
                          <h1>New Lead </h1>
                          <p>Agent Email Id :${agentEmail}</p>
                          <p>Agent Number :${agentNumber}</p>
                          <p>Customer Number:${custNumber}</p>
                          <p>Customer Email Id:${custEmail}</p>
                          <p> Inquired Property Address :${propertyAddress}</p>
                          <p>Please review the details and take necessary actions.</p>
                          <p>Thank you!</p>
                      </body>
                      </html>
              `,
        });
        const info2 = await transporter.sendMail({
          from: "amit100acre@gmail.com", // Sender address
          to: agentEmail,
          // to:'amit100acre@gmail.com', // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
         
           subject: "Post Property",
          html: `
                      <!DOCTYPE html>
                      <html lang:"en>
                      <head>
                      <meta charset:"UTF-8">
                      <meta http-equiv="X-UA-Compatible"  content="IE=edge">
                      <meta name="viewport"  content="width=device-width, initial-scale=1.0">
                      <title>New Inquiry on Post-Property </title>
                      </head>
                      <body>
                          <h1>New Lead </h1>
                          <p>Agent Email Id :${agentEmail}</p>
                          <p>Agent Number :${agentNumber}</p>
                          <p>Customer Number:${custNumber}</p>
                          <p>Customer Email Id:${custEmail}</p>
                          <p> Inquired Property Address :${propertyAddress}</p>
                          <p>Please review the details and take necessary actions.</p>
                          <p>Thank you!</p>
                      </body>
                      </html>
              `,
        });
      // await data.save();
      await Promise.all([data.save(),info,info2])
      } else {
        res.status(200).json({
          message: "please fill the form !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        messsage: "internal server error ",
      });
    }
  };



  static postEnquiry_view = async (req, res) => {
    try {
      const data = await postEnquiryModel.find();
      res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  // verify email
  static verifyEmail = async (req, res) => {
    const { email } = req.body;
    const otpNumber=generateToken()
    try {
      const checkEmail = await postPropertyModel.findOne({ email: email });
      if (checkEmail !== null) {
      return  res.status(401).json({
          message: "this email alredy exist !",
        });
      }
      const otpEmail = await Email_verify.findOne({ email: email });
      if (otpEmail) {
     return   res.status(200).json({
          message: "check your email otp sent already!",
          
        });
      }
      const transporter = nodemailer.createTransport({
        // SMTP configuration
        service: "gmail",
        auth: {
          user: "web.100acress@gmail.com",
          pass: "txww gexw wwpy vvda",
        },
      });
      const mailOptions = {
        from: "web.100acress@gmail.com",
        to: email,
        subject: "Email Verification",
        text: `Thank you for registering with 100acress.com. We are sending this email only to verify that it is indeed your email address. To complete your registration, verify otp : ${otpNumber}`,
      };
      try {
        // Send the email using async/await
        let info = await transporter.sendMail(mailOptions);
        // If sending the email succeeds, proceed to save the data
        const data = new Email_verify({
          email: email,
          otp: otpNumber,
        });
        await data.save();
        return res.status(200).json({
          message: "Verification email sent and saved successfully!",
        });
      } catch (error) {
        return res.status(500).json({
          message: "Error!",
          error: error.message || error,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: error,
      });
    }
  };

  static otpVerify = async (req, res) => {
    try {
      const { otp } = req.body;
      console.log(otp)
      if (otp) {
        const data = await Email_verify.findOne({ otp: otp });
        if (data) {
         return res.status(200).json({
            message: "Email successfully verified !",
            data,
          });
        } else {
        return  res.status(401).json({
            message: "Check entered otp !",
          });
        }
      }
    } catch (error) {
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };

  
}
module.exports = PostPropertyController;
