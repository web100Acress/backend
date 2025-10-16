const postPropertyModel = require("../../../models/postProperty/post");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cache = require("memory-cache");
const postEnquiryModel = require("../../../models/postProperty/enquiry");
const Email_verify = require("../../../models/postProperty/emailVerify");
const mongoose = require("mongoose");
require("dotenv").config();
const { isValidObjectId } = require("mongoose");
const fs = require("fs");
const path = require("path");
const {
  uploadFile,
  deleteFile,
  updateFile,
  sendEmail
} = require("../../../Utilities/s3HelperUtility");
const { createDecipheriv } = require("crypto");

// Simple logger setup
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`)
};

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
  // Generate a random number between 100000 and 999999 (inclusive)
  const otp = Math.floor(Math.random() * 900000) + 100000;

  // Convert to string and pad with leading zeros if necessary
  return String(otp).padStart(6, "0");
};

const sendResetEmail = async (email, token) => {
  // Connect with SMTP Gmail
  const htmlPath = path.join(__dirname, "../../../Templates/Email/forget.html");
  const data = await fs.promises.readFile(htmlPath, "utf8");
  const username = email.split("@")[0];
  const htmlContent = data.replaceAll("{{token}}", token).replaceAll("{{username}}", username);

  let emailSuccess = true;
  // Send mail with defined transport object
  try {
    const subject = "Password Reset";
    const attachments = [
      {
        filename: "fblogo.png", // Use PNG instead of SVG
        path: path.join(__dirname, "../../../Templates/Email/Icons/facebook-circle-fill.png"), // Local path to your PNG file
        cid: "fblogo"
      },
      {
        filename: "lnkdlogo.png", // Use PNG instead of SVG
        path: path.join(__dirname, "../../../Templates/Email/Icons/linkedin-box-fill.png"), // Local path to your PNG file
        cid: "lnkdlogo"
      },
      {
        filename: "instalogo.png", // Use PNG instead of SVG
        path: path.join(__dirname, "../../../Templates/Email/Icons/instagram-fill.png"), // Local path to your PNG file
        cid: "instalogo"
      },
      {
        filename: "twlogo.png", // Use PNG instead of SVG
        path: path.join(__dirname, "../../../Templates/Email/Icons/twitter-x-line.png"), // Local path to your PNG file
        cid: "twlogo"
      }
    ]
    emailSuccess = await sendEmail(email,"support@100acress.com",[],subject,htmlContent,true)
  } catch (error) {
    console.log("Error in sending password reset email",error);
  }
  return emailSuccess;
};


const sendPostEmail = async (email, propertyDetails = {}) => {
  let emailSuccess = true;
  let emailSuccess1;
  let emailSuccess2;
  
  // Default property details if not provided
  const {
    title = 'N/A',
    propertyType = 'N/A',
    location = 'N/A',
    price = 'N/A',
    propertyId = 'N/A',
    description = 'No description provided'
  } = propertyDetails;
  
  try {
    let from = "support@100acress.com";
    let to = "officialhundredacress@gmail.com";
    let subject = "New Property Submission";
    
    // Admin email template with property details and verify button
    let adminHtml = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Property Submission</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 15px; text-align: center; border-radius: 5px; }
        .property-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .detail-row { margin-bottom: 10px; }
        .detail-label { font-weight: bold; color: #555; }
        .verify-btn {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          margin: 15px 0;
          font-weight: bold;
        }
        .verify-btn:hover { background-color: #45a049; }
        .footer { margin-top: 20px; font-size: 0.9em; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Property Submission</h1>
      </div>
      
      <p>Hello,</p>
      <p>A new property has been submitted by: <strong>${email}</strong></p>
      
      <div class="property-details">
        <h3>Property Details:</h3>
        <div class="detail-row">
          <span class="detail-label">Title:</span> ${title}
        </div>
        <div class="detail-row">
          <span class="detail-label">Type:</span> ${propertyType}
        </div>
        <div class="detail-row">
          <span class="detail-label">Location:</span> ${location}
        </div>
        <div class="detail-row">
          <span class="detail-label">Price:</span> ${price}
        </div>
        <div class="detail-row">
          <span class="detail-label">Description:</span> ${description}
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'https://100acress.com'}/admin/verify-property/${propertyId}" class="verify-btn">
          Verify Property
        </a>
        <p style="font-size: 0.9em; color: #666;">
          (Only visible to admin users. Regular users will see an access denied message.)
        </p>
      </div>

      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} 100Acress. All rights reserved.</p>
      </div>
    </body>
    </html>`;
    // Send email to admin with verification link
    emailSuccess1 = await sendEmail(to, from, [], subject, adminHtml, false);
  
    // Prepare user confirmation email
    const propertySubmissionHtmlPath = path.join(__dirname, "../../../Templates/Email/propertyList.html");
    const propertySubmissionData = await fs.promises.readFile(propertySubmissionHtmlPath, "utf8");
    
    // Enhance user email with verification status and property link
    let userHtml = propertySubmissionData
      .replace('{{propertyId}}', propertyId)
      .replace(
        '<!-- Verification Status -->',
        '<div style="background-color: #e6f7ff; padding: 15px; border-left: 4px solid #1890ff; margin: 15px 0;">' +
        '<h3 style="margin-top: 0; color: #1890ff;">Verification Status</h3>' +
        '<p>Your property submission is under review by our admin team.</p>' +
        '<p>You will be notified once it has been verified and published.</p>' +
        '<p>Thank you for your patience!</p>' +
        '</div>'
      );

    emailSuccess2 = await sendEmail(email, from, [], 'Property Submission Received', userHtml, true);

    emailSuccess = emailSuccess1 && emailSuccess2;
  
  } catch (error) {
    console.log("Error in sending post property email",error);
    emailSuccess = false;
  }
  return emailSuccess;
};

class PostPropertyController {
  static postPerson_Register = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { name, email, mobile, password, cpassword, role } = req.body;

      if (!name || !email || !password || !cpassword || !mobile || !role) {
        res.status(400).json({
          message: "Please fill in all fields!",
        });
        return;
      }

      let emailLowerCase = email.toLowerCase();
      const verify = await postPropertyModel
        .findOne({ email: email })
        .session(session);
      // console.log(verify);

      // true or false

      if (verify) {
        res.status(409).json({
          message: "User already exists!",
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
        email: emailLowerCase,
        password: hashpassword,
        mobile: mobile,
        role: role,
      });
      await data.save({ session });

      await session.commitTransaction();
      session.endSession();

      const token = jwt.sign(
        { user_id: data._id, role: "user" },
        process.env.JWT_SECRET || "aman123",
      );
      res.status(201).json({
        message: "Registration successfully done!",
        token: token,
        User: data,
      });
    } catch (error) {
      // console.log(error);
      await session.abortTransaction();
      session.endSession();
      if (error.name === "ValidationError") {
        return res.status(401).json({
          message: "You are not authorized to change the role",
        });
      }
      return res.status(500).json({
        message: "Internal server error!",
      });
    }
  };
  // verify login for seller
  static postPerson_VerifyLogin = async (req, res) => {
    try {
      const { email, password } = req.body;

      if (email && password) {
        let emailToLowerCase = email.toLowerCase();
        const User = await postPropertyModel.findOne({
          email: emailToLowerCase,
        });

        if (User != null) {
          const isMatch = await bcrypt.compare(password, User.password);

          if (emailToLowerCase == User.email && isMatch) {
            if (User.role === "Admin") {
              const token = jwt.sign(
                { user_id: User._id, role: "Admin" },
                process.env.JWT_SECRET || "aman123",
              );
              if (User.emailVerified == false) {
                return res.status(403).json({
                  message: "Please verify your email before sign in !",
                  User,
                  token,
                });
              }
              return res.status(200).json({
                message: " Admin login successfully ! ",
                token,
                User,
              });
            } else {
              if (User.emailVerified == false) {
                const token = jwt.sign(
                  { user_id: User._id, role: "user" },
                  process.env.JWT_SECRET || "aman123",
                );
                return res.status(403).json({
                  message: "Please verify your email before sign in !",
                  User,
                  token,
                });
              }
              const token = jwt.sign(
                { user_id: User._id, role: User.role },
                process.env.JWT_SECRET || "aman123",
              );

              return res.status(200).json({
                message: " login successfully done  ! ",
                token,
                User,
              });
            }
          } else {
            return res.status(401).json({
              message: "Please verify your email and password before sign in !",
            });
          }
        } else {
          return res.status(200).json({
            message: "Registration is required before sign in ! ",
          });
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  static postPerson_verifyRole = async (req, res) => {
    try {
      const email = req.params.email;
      // console.log(req.params.email)
      if (email) {
        const User = await postPropertyModel.findOne({ email: email })
          .populate('postProperty'); // Populate the postProperty array
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
    console.log(email);
    try {
      if (email) {
        const user = await postPropertyModel.findOne({ email: email });
        // console.log(user);
        if (!user) {
          res.status(404).json({
            message: " User not found , sign in before login  ! ",
          });
        } else {
          // console.log("token");
          const token = generateToken();
          // console.log("token1");
          const resetToken = await postPropertyModel.findByIdAndUpdate(
            user._id,
            {
              token: token,
            },
          );
          // console.log(token, resetToken, "fhwe");
          await resetToken.save();
          const emailSuccess = await sendResetEmail(email, token);
          if(emailSuccess){
            return res.status(200).json({
              message: "Password reset link sent successfully",
            });
          }else{
            return res.status(500).json({
              message: "Failed to send password reset link",
            });
          }
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
          },
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
  static postPerson_View_AllListedProperty = async (req, res) => {
    try {
      // Check cache first
      const {
        page  = '1',
        limit =  '10',
        sortByField = 'createdAt',
        sortBy = 'desc',
        verify = 'verified',
      } = req.query;

          // Validate sort field
      const allowedSortFields = ['createdAt', 'price', 'updatedAt'];
      if (!allowedSortFields.includes(sortByField)) {
        return res.status(400).json({ message: "Invalid sort field" });
      }

      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
      const skip = (pageNumber - 1) * limitNumber;
      const sortOrder = sortBy === "desc" ? -1 : 1;

      const isVerified = verify === 'verified' ? 'verified' : 'unverified';

      const cachedData = cache.get(`allProperties-${skip}-${limit}-${sortOrder}-${isVerified}`);

      if (cachedData) {
        return res.status(200).json({
          message: "Data from cache",
          data: cachedData,
        });
      }
      // If cache is empty, fetch from database
      const data = await postPropertyModel.aggregate([
        {$unwind:"$postProperty"},
        {
          $match:{
          "postProperty.verify": isVerified,
          }
        },
        {
          $facet:{
          metadata:[{ $count:"total" }],
          data:[
            {
              $project: {
                name: "$name",
                _id: "$postProperty._id", // Include the property's _id if needed
                frontImage: "$postProperty.frontImage",
                otherImage: "$postProperty.otherImage",
                propertyType: "$postProperty.propertyType",
                propertyName: "$postProperty.propertyName",
                price: "$postProperty.price",
                area: "$postProperty.area",
                availableDate: "$postProperty.availableDate",
                descripation: "$postProperty.descripation",
                furnishing: "$postProperty.furnishing",
                builtYear: "$postProperty.builtYear",
                amenities: "$postProperty.amenities",
                landMark: "$postProperty.landMark",
                type: "$postProperty.type",
                city: "$postProperty.city",
                state: "$postProperty.state",
                address: "$postProperty.address",
                email: "$postProperty.email",
                number: "$postProperty.number",
                verify: "$postProperty.verify",
                propertyLooking: "$postProperty.propertyLooking",
                createdAt: "$postProperty.createdAt",
                updatedAt: "$postProperty.updatedAt",
              }
            },
            { $sort: { [sortByField]: sortOrder } },
            { $skip: skip },
            { $limit: limitNumber },
          ]
        }
      },
      {
        $project: {
          data: 1,
          total: { $ifNull: [{ $arrayElemAt: ["$metadata.total", 0] }, 0] },
          totalPages: { $ceil: { $divide: [{ $ifNull: [{ $arrayElemAt: ["$metadata.total", 0] }, 0] }, limitNumber] } },
          currentPage: page,
        }
      }
      ]);

      // Cache the data with an expiration time of 5 minutes
      const expirationTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      cache.put(`allProperties-${skip}-${limit}-${sortOrder}-${isVerified}`, data, expirationTime);

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
    try {
      // Only extract the fields we want to update to avoid role validation issues
      const { name, email, address, mobile } = req.body;
      
      console.log('[postPerson_update] Request body keys:', Object.keys(req.body));
      console.log('[postPerson_update] Updating user:', req.params.id);
      
      if (!req.params.id) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      // Build update object with only the fields we want to update
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (address !== undefined) updateData.address = address;
      if (mobile !== undefined) updateData.mobile = mobile;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          message: "No valid fields to update",
        });
      }

      // Use findByIdAndUpdate with new: true to get the updated document
      // and runValidators: true to run validation on the update
      const data = await postPropertyModel.findByIdAndUpdate(
        req.params.id, 
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      );

      if (!data) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.status(200).json({
        message: "Updated successfully!",
        data,
      });
    } catch (error) {
      console.error('[postPerson_update] Error:', error);
      
      // Handle validation errors specifically
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          message: "Validation error",
          errors: validationErrors,
        });
      }
      
      // Handle cast errors (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          message: "Invalid user ID format",
        });
      }

      res.status(500).json({
        message: "Internal server error",
      });
    }
  };
  //change password
  static Post_changePassword = async (req, res) => {
    try {
      const { email, password, currentPassword } = req.body;
      // Debug log (no sensitive data)
      try { console.log('[Post_changePassword] hit', { email, ip: req.ip }); } catch {}
      if (!email || !password) {
        return res.status(400).json({ message: "Email and new password are required" });
      }

      // Basic policy: keep consistent with register (min length)
      if (typeof password !== 'string' || password.length < 5) {
        return res.status(400).json({ message: "Password must be at least 5 characters" });
      }

      const emailLower = String(email).toLowerCase();
      const user = await postPropertyModel.findOne({ email: emailLower });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If currentPassword is provided, verify it matches existing
      if (currentPassword && typeof currentPassword === 'string') {
        const ok = await bcrypt.compare(currentPassword, user.password || '');
        if (!ok) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      }

      const hashpassword = await bcrypt.hash(password, 10);
      user.password = hashpassword;
      await user.save();

      // Send confirmation email (no sensitive info)
      try {
        const subject = "Your 100acress password was changed";
        const username = user.email.split('@')[0];
        const html = `<!DOCTYPE html>
        <html><body>
          <p>Hi ${username},</p>
          <p>This is a confirmation that the password for your account was just changed.</p>
          <p>If you did not perform this action, please reset your password immediately or contact support.</p>
          <p>— 100acress Support</p>
        </body></html>`;
        await sendEmail(user.email, "support@100acress.com", [], subject, html, true);
      } catch (mailErr) {
        // Log but don't fail the API if email sending fails
        console.log("Error sending password change confirmation email", mailErr);
      }

      return res.status(200).json({ message: "Your password has been updated successfully" });
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
        console.log(req.params.id,"id of person")
        const personData = await postPropertyModel.findById({ _id: id });
        console.log(personData,"personData")
        const email = personData.email;
        const number = personData.mobile;
        const agentName = personData.name;
        const role = personData.role;
        let frontImage = await uploadFile(req.files.frontImage[0]);
        let otherImage = await Promise.all(
          req.files.otherImage.map((file) => uploadFile(file)),
        );

        const data = {
          propertyType: req.body.propertyType,
          propertyName: req.body.propertyName,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          price: req.body.price,
          priceunits: req.body.priceunits,
          bedrooms: req.body.bedrooms,
          bathrooms: req.body.bathrooms,
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
          verify: "unverified",
          agentName: agentName,
          role: role,
          frontImage: {
            public_id: frontImage.Key,
            url: frontImage.Location,
          },
          otherImage: otherImage.map((file) => ({
            public_id: file.Key,
            url: file.Location,
          })),
          propertyLooking: req.body.propertyLooking,
        };


        if (id) {
          const dataPushed = await postPropertyModel.findOneAndUpdate(
            { _id: id },
            { $push: { postProperty: data } },
            { new: true },
          );

          const email = dataPushed.email;
          const emailSuccess = await sendPostEmail(email, {
            title: dataPushed.title || 'N/A',
            propertyType: dataPushed.propertyType || 'N/A',
            location: dataPushed.location || 'N/A',
            price: dataPushed.price || 'N/A',
            propertyId: dataPushed._id || 'N/A',
            description: dataPushed.description || 'No description provided'
          });
          return res.status(200).json({
            message: emailSuccess ? "Data pushed successfully ! " : "Data pushed successfully but there was an issue sending confirmation emails",

          });
        } else {
          return res.status(400).json({
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

        const frontImage = await uploadFile(req.files.frontImage[0]);

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
            url: frontImage.Key,
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
            { new: true },
          );

          const email = dataPushed.email;

          const emailSuccess = await sendPostEmail(email, {
            title: dataPushed.title || 'N/A',
            propertyType: dataPushed.propertyType || 'N/A',
            location: dataPushed.location || 'N/A',
            price: dataPushed.price || 'N/A',
            propertyId: dataPushed._id || 'N/A',
            description: dataPushed.description || 'No description provided'
          });
          //Clear all the cache if new property posted
          cache.clear();

          return res.status(200).json({
            message: emailSuccess ? "Data pushed successfully ! " : "Data pushed successfully but there was an issue sending confirmation emails",
          });
        } else {
          return res.status(200).json({
            message: "user id not found ! ",
          });
        }
      } else {
        const id = req.params.id;
        const personData = await postPropertyModel.findOne({ _id: id });
        const email = personData.email;
        const number = personData.mobile;
        const agentName = personData.name;
        const frontImage = personData?.frontImage;
        const otherImage = personData?.otherImage;
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

          otherImage: otherImage,
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
            { new: true },
          );

const email = dataPushed.email;

          const emailSuccess = await sendPostEmail(email, {
            title: dataPushed.title || 'N/A',
            propertyType: dataPushed.propertyType || 'N/A',
            location: dataPushed.location || 'N/A',
            price: dataPushed.price || 'N/A',
            propertyId: dataPushed._id || 'N/A',
            description: dataPushed.description || 'No description provided'
          });

          return res.status(200).json({
            message: emailSuccess ? "Data pushed successfully ! " : "Data pushed successfully but there was an issue sending confirmation emails",
          });
        } else {
          return res.status(200).json({
            message: "user id not found ! ",
          });
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // postproperty  data user wise  All view lks
  static postProperty_View = async (req, res) => {
    try {
      const id = req.params.id;
      const data = await postPropertyModel.findById({ _id: id }).select(
        "-password -token -__v -verify -createdAt -updatedAt -emailVerified -role",
      );
      if (data) {
        return res.status(200).json({
          message: "All project Data get  !",
          data,
        });
      } else {
        return res.status(400).json({
          message: " data not found !",
        });
      }
    } catch (error) {
      return res.status(500).json({
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
        },
      );
      if (data) {
        return res.status(200).json({
          message: "data retrieved successfully ! ",
          data,
        });
      } else {
        return res.status(200).json({
          message: "data not found !",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
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
        },
      );
      // console.log(data)
      return res.status(200).json({
        message: "data get Successsfully ! ",
        data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // postproperty data upate
  static postProperty_Update = async (req, res) => {
    try {
      const id = req.params.id;
      if (!isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid object id!" });
      }
      const { verify } = req.body;

      let update = { $set: {} };

      const data = await postPropertyModel.findOne(
        { "postProperty._id": id },
        { "postProperty.$": 1 },
      );

      if (!data || !data.postProperty.length) {
        return res.status(404).json({ error: "Property not found." });
      }

      if (req.files?.frontImage) {
        const frontImageFile = req.files.frontImage[0];
        const frontObjectKey = data.postProperty[0].frontImage.public_id;
               
        const frontResult = await updateFile(frontImageFile, frontObjectKey);

        update.$set["postProperty.$.frontImage"] = {
          public_id: frontResult.Key,
          url: frontResult.Location,
        };
      }

      // Handle Other Images Update
      if (req.files?.otherImage) {
        const otherImages = req.files.otherImage; // Array of files
        const existingOtherImages = data.postProperty[0].otherImage;

        // Assuming you want to replace all existing other images
        const updateOtherImages = await Promise.all(
          otherImages.map(async (img, index) => {
            const existingKey = existingOtherImages[index]?.public_id;
            // If updating existing, else add new (adjust based on your logic)
            return existingKey
              ? await updateFile(img, existingKey)
              : await uploadFile(img); // Implement uploadNewFile if adding
          }),
        );
        
        update.$set["postProperty.$.otherImage"] = updateOtherImages.map(
          (img) => ({
            public_id: img.Key,
            url: img.Location,
          }),
        );
      }

      // Update Fields (add to $set without overwriting)
      const fields = {
        propertyName: "postProperty.$.propertyName",
        propertyType: "postProperty.$.propertyType",
        address: "postProperty.$.address",
        area: "postProperty.$.area",
        city: "postProperty.$.city", 
        state: "postProperty.$.state",
        price: "postProperty.$.price",
        descripation: "postProperty.$.descripation",
        furnishing: "postProperty.$.furnishing",
        builtYear: "postProperty.$.builtYear",
        type: "postProperty.$.type",
        amenities: "postProperty.$.amenities",
        landMark: "postProperty.$.landMark",
        availableDate: "postProperty.$.availableDate",
        propertyLooking: "postProperty.$.propertyLooking",
        verify: "postProperty.$.verify",
      };
      Object.entries(fields).forEach(([key, path]) => {
        if (req.body[key] !== undefined && req.body[key] !== null) {
          // Check if field is provided
          update.$set[path] = req.body[key];
        }
      });
      // Perform the update
      const updatedDoc = await postPropertyModel.findOneAndUpdate(
        { "postProperty._id": id },
        update,
        { new: true },
      );

      if (!updatedDoc) {
        return res.status(404).json({ error: "Property not found." });
      }

      const agentEmail = updatedDoc.email;
      let emailSuccess;

      if (data.postProperty[0].verify !== "verified" && verify == "verified") {
        const htmlPath = path.join(__dirname, "../../../Templates/Email/propverification.html");
        const data = await fs.promises.readFile(htmlPath,{encoding: "utf8"});
        const htmlContent = data
                .replaceAll("{{name}}", updatedDoc.postProperty[0].propertyName)
                .replaceAll("{{address}}", updatedDoc.postProperty[0].address)
                .replaceAll("{{pUrl}}", updatedDoc.postProperty[0].propertyName.replace(" ", "-"))
                .replaceAll("{{id}}", id);
        
        // Send mail with AWS
        let sourceEmail = "support@100acress.com";
        let to = agentEmail;
        let subject = "Verified Your Property";
        let html = htmlContent;


        try {

          emailSuccess = await sendEmail(to,sourceEmail,[],subject,html,true);
        } catch (error) {
          console.log("Error in sending email",error);
          emailSuccess = false;
        }

      }
      //clear the cache if property updated successfully
      cache.clear();
      
      return res.status(200).json({
        message: emailSuccess ? "Property updated successfully" : "Property updated successfully but there was an issue sending confirmation emails",
      });

    } catch (error) {
      console.error("Update error:", error);
      return res.status(500).json({ error: "Internal server error!" });
    }
  };

  static postProerty_User_Update = async (req, res) => {

      try {
        const id = req.params.id;
        if (!isValidObjectId(id)) {
          return res.status(400).json({ error: "Invalid object id!" });
        }
  
        let update = { $set: {} };
  
        const data = await postPropertyModel.findOne(
          { "postProperty._id": id },
          { "postProperty.$": 1 },
        );
  
        if (!data || !data.postProperty.length) {
          return res.status(404).json({ error: "Property not found." });
        }
  
        if (req.files?.frontImage) {
          const frontImageFile = req.files.frontImage[0];
          const frontObjectKey = data.postProperty[0].frontImage.public_id;
                 
          const frontResult = await updateFile(frontImageFile, frontObjectKey);
  
          update.$set["postProperty.$.frontImage"] = {
            public_id: frontResult.Key,
            url: frontResult.Location,
          };
        }
  
        // Handle Other Images Update
        if (req.files?.otherImage) {
          const otherImages = req.files.otherImage; // Array of files
          const existingOtherImages = data.postProperty[0].otherImage;
  
          // Assuming you want to replace all existing other images
          const updateOtherImages = await Promise.all(
            otherImages.map(async (img, index) => {
              const existingKey = existingOtherImages[index]?.public_id;
              // If updating existing, else add new (adjust based on your logic)
              return existingKey
                ? await updateFile(img, existingKey)
                : await uploadFile(img); // Implement uploadNewFile if adding
            }),
          );
          
          update.$set["postProperty.$.otherImage"] = updateOtherImages.map(
            (img) => ({
              public_id: img.Key,
              url: img.Location,
            }),
          );
        }
  
        // Update Fields (add to $set without overwriting)
        const fields = {
          propertyName: "postProperty.$.propertyName",
          propertyType: "postProperty.$.propertyType",
          address: "postProperty.$.address",
          area: "postProperty.$.area",
          city: "postProperty.$.city", 
          state: "postProperty.$.state",
          price: "postProperty.$.price",
          descripation: "postProperty.$.descripation",
          furnishing: "postProperty.$.furnishing",
          builtYear: "postProperty.$.builtYear",
          type: "postProperty.$.type",
          amenities: "postProperty.$.amenities",
          landMark: "postProperty.$.landMark",
          availableDate: "postProperty.$.availableDate",
          propertyLooking: "postProperty.$.propertyLooking"
        };
        
        Object.entries(fields).forEach(([key, path]) => {
          if (req.body[key] !== undefined && req.body[key] !== null) {
            // Check if field is provided
            update.$set[path] = req.body[key];
          }
        });
        // Perform the update
        const updatedDoc = await postPropertyModel.findOneAndUpdate(
          { "postProperty._id": id },
          update,
          { new: true },
        );
  
        if (!updatedDoc) {
          return res.status(404).json({ error: "Property not found." });
        }
  
        return res.status(200).json({
          message: "Property updated successfully",
        });
      } catch (error) {
        console.error("Update error:", error);
        return res.status(500).json({ error: "Internal server error!" });
      }
  };

  // postproperty delete
  static postProperty_Delete = async (req, res) => {
    try {
      const propertyId = req.params.id;
      console.log("Property ID:", propertyId);
      
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        return res.status(400).json({ error: "Invalid property ID format" });
      }

      const user = await postPropertyModel.findOne({
        "postProperty._id": propertyId,
      });

      if (!user) {
        return res.status(404).json({ error: "Post property not found" });
      }

      const matchedPostProperty = user.postProperty.find(
        (postProperty) => postProperty._id.toString() === propertyId,
      );

      if (!matchedPostProperty) {
        return res.status(404).json({ error: "Post property not found" });
      }

      // Try to delete files from S3 (but don't abort if it fails)
      try {
        // Delete front image if exists
        if (matchedPostProperty.frontImage && matchedPostProperty.frontImage.public_id) {
          console.log("Deleting front image:", matchedPostProperty.frontImage.public_id);
          await deleteFile(matchedPostProperty.frontImage.public_id);
        }

        // Delete other images if exist
        if (matchedPostProperty.otherImage && Array.isArray(matchedPostProperty.otherImage)) {
          for (let i = 0; i < matchedPostProperty.otherImage.length; i++) {
            const image = matchedPostProperty.otherImage[i];
            if (image && image.public_id) {
              console.log("Deleting other image:", image.public_id);
              await deleteFile(image.public_id);
            }
          }
        }
        console.log("S3 files deleted successfully");
      } catch (s3Error) {
        console.error("Failed to delete some S3 files:", s3Error);
        // Continue with database deletion even if S3 deletion fails
        console.log("Continuing with database deletion despite S3 errors");
      }

      // Proceed with database deletion regardless of S3 deletion status
      const index = user.postProperty.findIndex(
        (postProperty) => postProperty._id.toString() === propertyId,
      );
      
      if (index === -1) {
        return res.status(404).json({ error: "Post property not found" });
      }
      
      user.postProperty.splice(index, 1);
      await user.save();
      
      // Clear cache after successful deletion
      cache.clear();
      
      res.status(200).json({ message: "Post property deleted successfully" });
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  static postPropertyEnquiry = async (req, res) => {
    try {
      const {
        agentEmail,
        agentNumber,
        custName,
        custEmail,
        custNumber,
        propertyAddress,
      } = req.body;
      console.log(req.body);
      if (req.body) {
        const data = new postEnquiryModel({
          agentEmail: agentEmail,
          agentNumber: agentNumber,
          custName: custName,
          custEmail: custEmail,
          custNumber: custNumber,
          propertyAddress: propertyAddress,
        });
        const template = await fs.promises.readFile(path.join(__dirname, '../../../Templates/Email/ResaleInq.html'), 'utf8');
        const htmlContent = template.replace('{{agentEmail}}', agentEmail)
              .replace('{{name}}', custName)
              .replace('{{email}}', custEmail)
              .replace('{{customerphone}}', custNumber)
              .replace('{{agentphone}}', agentNumber)
              .replace('{{agentemail}}', agentEmail)
              .replace('{{propertyaddress}}', propertyAddress);
        let emailSuccess = true;
        try {

          let sourceEmail = "support@100acress.com";
          let to = agentEmail;
          // Remove vinay.aadharhomes@gmail.com from all CC lists
          let cc = [];
          let subject = "Post Property";
          let html = htmlContent;
          let attachments = true;
          emailSuccess = await sendEmail(to, sourceEmail, cc, subject, html, attachments);

        } catch (error) {
          console.log("Error in sending email: ",error);
          emailSuccess = false;
        }

        const savedData = await data.save();

        return res.status(200).json({
          message: emailSuccess ?  "We Have Received Your Enquiry! We Will Contact You Soon" : "Enquiry received! We saved your details but there was an issue sending confirmation emails",
          data:savedData,
        });        
      } else {
        return res.status(400).json({
          message: "please fill the form !",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  static postEnquiry_view = async (req, res) => {
    try {
      const data = await postEnquiryModel.find({});
      return res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static postEnquiry_delete = async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: 'id is required' });
      const existing = await postEnquiryModel.findById(id);
      if (!existing) return res.status(404).json({ message: 'Enquiry not found' });
      await postEnquiryModel.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
      console.error('postEnquiry_delete error', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
  // verify email
  static verifyEmail = async (req, res) => {
    let { email } = req.body;                                                                                      
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    let emailToLowerCase = email.toLowerCase();

    const otpNumber = generateToken();
    try {
      const checkEmail = await postPropertyModel.findOne({
        email: emailToLowerCase,
      });
      if (checkEmail.emailVerified === true) {
        return res.status(401).json({
          message: "this email alredy Verified !",
        });
      }
      const otpEmail = await Email_verify.findOne({ email: email });

      if (otpEmail) {
        
        return res.status(409).json({
          message: "check your email otp sent already!",
        });
      }

      const template = await fs.promises.readFile(path.join(__dirname, '../../../Templates/Email/otp.html'), 'utf8');
      const username = email.split("@")[0];
      const htmlContent = template
                              .replaceAll('{{otp}}', otpNumber)
                              .replaceAll('{{username}}',username);
      
      try {
        let sourceEmail = "support@100acress.com";
        let to = email;
        let subject = "Email Verification";
        let html = htmlContent;
        let attachments = true;

        const emailSuccess = await sendEmail(to,sourceEmail,[],subject,html,attachments);
        console.log("Email sent successfully",emailSuccess);
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
      return res.status(500).json({
        message: error,
      });
    }
  };
  static otpVerify = async (req, res) => {
    try {
      const { otp } = req.body;
      // console.log(otp)
      if (otp) {
        const data = await Email_verify.findOne({ otp: otp });
        if (data) {
          await postPropertyModel.updateOne(
            { email: data.email },
            { $set: { emailVerified: true } },
          );
          await Email_verify.deleteOne({ email: data.email });
          return res.status(200).json({
            message: "Email successfully verified !",
            data,
          });
        } else {
          return res.status(401).json({
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

  static welcome = async (req, res) => {
    try {
      logger.info(`Request received: ${req.method} ${req.path}`);
      return res.status(200).json({
        message: "Welcome to the PostProperty API Service!"
      });
    } catch (error) {
      logger.info(`Error in welcome endpoint: ${req.method} ${req.path}`);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
}
module.exports = PostPropertyController;
