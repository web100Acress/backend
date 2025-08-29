const registerModel = require("../../../models/register/registerModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const postPropertyModel = require("../../../models/postProperty/post");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// const generateToken = () => {
//     return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
// };

// const sendResetEmail = async (email, token) => {
//     // Connect with SMTP Gmail
//     const transporter = await nodemailer.createTransport({
//         host: 'smtp.gmail.com',
//         port: 587,
//         auth: {
//             user: process.env.Email,
//             pass: process.env.EmailPass
//         },
//     });
//     // Send mail with defined transport object
//     let info = await transporter.sendMail({
//         from: 'test@gmail.com', // Sender address
//         to: "amit100acre@gmail.com", // List of receivers (admin's email) =='query.aadharhomes@gmail.com'
//         subject: 'Password Reset',
//         html: `
//         <!DOCTYPE html>
//         <html lang:"en>
//         <head>
//         <meta charset:"UTF-8">
//         <meta http-equiv="X-UA-Compatible"  content="IE=edge">
//         <meta name="viewport"  content="width=device-width, initial-scale=1.0">
//         <title>Forgot Password</title>
//         </head>
//         <body>
//         <p>Dear User,</p>
//         <p>Click the following link to reset your password : </p>

//         <p>

//         <a href="http://localhost:3500/reset/${token}" target="_blank" rel="noopener noreferrer">Reset Your Password </a>
//         </p>

//          <p>If you didn't request to password reset , please ingore this email  </p>

//         <p>Best regrads ,
//              <br>https://www.100acress.com/
//         </p>
//         </body>
//         </html>
// `
//     });

// }
class registerController {
  static register = async (req, res) => {
    try {
      const { name, email, password, cpassword, mobile } = req.body;
      const verify = await registerModel.findOne({ email: email });

      if (verify) {
        res.status(500).json({
          message: "user already register",
        });
      } else {
        if (name && email && password && cpassword && mobile) {
          if (password == cpassword) {
            try {
              const hashpassword = await bcrypt.hash(password, 10);
              const result = new registerModel({
                name: name,
                email: email,
                mobile: mobile,
                password: hashpassword,
              });
              console.log(result);
              await result.save();
              res.status(200).json({
                message: "registration successfull please login !",
              });
            } catch (error) {
              console.log(error);
              res.status(500).json({
                message: "something went wrong ! ",
              });
            }
          } else {
            res.status(401).json({
              message: " password and confirm password not match  ! ",
            });
          }
        } else {
          res.status(200).json({
            message: "something went wrong ! ",
          });
        }
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "something went wrong ! ",
      });
    }
  };

  static verify_Login = async (req, res) => {
    // res.send("hello login verify")
    try {
      const { email, password } = req.body;
      if (email && password) {
        const user = await registerModel.findOne({ email: email });
        if (user != null) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (user.email == email && isMatch) {
            if (user.role == "admin") {
              const token = jwt.sign(
                { user_id: user._id, role: "Admin" },
                process.env.JWT_SECRET || "amitchaudhary100",
              );
              // console.log(token)
              //  console.log(token)
              res.cookie("token", token);
              // res.json('token', token)
              res.status(200).json({
                message: "admin pannel login successful! ",
                token: token,
              });
            } else {
              const token = jwt.sign(
                { user_id: user._id, role: "user" },
                process.env.JWT_SECRET || "amitchaudhary100",
              );
              res.cookie("token", token);
              res.status(200).json({
                message: "admin user login successful! ",
              });
            }
          } else {
            res.status(500).json({
              message: "check your email and password that enter",
            });
          }
        } else {
          res.status(401).json({
            message: "this email yet not register",
          });
        }
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static logout = async (req, res) => {
    // res.send('hello logout')
    try {
      res.clearCookie("token");
      res.status(200).json({
        message: "logout !",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "something went wrong !",
      });
    }
  };
  // forget password
  static forgetPassword = async (req, res) => {
    const { email } = req.body;
    try {
      const user = await registerModel.findOne({ email: email });
      // console.log(user)
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // genrate token
      const token = generateToken();
      const resetToken = await registerModel.findByIdAndUpdate(user._id, {
        token: token,
      });
      await resetToken.save();

      // Send email with reset link
      await sendResetEmail(email, token);

      res.status(200).json({
        message: "Password reset link sent to your email id !",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  };
  // Handle password reset
  static reset = async (req, res) => {
    // res.send("djhdbsdcdkb")
    const { token } = req.params;
    const { password } = req.body;
    console.log(password);
    // console.log(token,password)
    try {
      if (password) {
        const hashpassword = await bcrypt.hash(password, 10);

        const user = await registerModel.findOneAndUpdate(
          { token: token },
          {
            password: hashpassword,
          },
        );
        console.log(user);
        user.token = "";
        await user.save();
        //  const data=user.token

        // const token=user.token;

        res.json({ message: "Password reset successful" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  };
  static deleteUserAndProperties = async (req, res) => {
    try {
      const { id } = req.params;
      // Find user by id
      const user = await registerModel.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Delete user
      await registerModel.findByIdAndDelete(id);
      // Delete all properties linked to this user (by email or mobile)
      const propertyDeleteResult = await postPropertyModel.deleteMany({
        $or: [
          { email: user.email },
          { mobile: user.mobile }
        ]
      });
      return res.status(200).json({
        message: "User and all their properties deleted successfully!",
        deletedProperties: propertyDeleteResult.deletedCount
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Google OAuth login/signup
  static googleAuth = async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required' });
      }

      // Verify the Google token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      const { email, name, picture, sub: googleId } = payload;

      // Check if user exists with this Google ID
      let user = await registerModel.findOne({ googleId });

      if (!user) {
        // Check if user exists with this email but signed up without Google
        user = await registerModel.findOne({ email });
        
        if (user) {
          // Update existing user with Google ID
          user.googleId = googleId;
          if (!user.avatarUrl) user.avatarUrl = picture;
          await user.save();
        } else {
          // Create new user with Google
          user = new registerModel({
            name,
            email,
            googleId,
            avatarUrl: picture,
            role: 'user',
            // Google-authenticated users don't need a password
          });
          await user.save();
        }
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
        { user_id: user._id, role: user.role },
        process.env.JWT_SECRET || 'amitchaudhary100',
        { expiresIn: '30d' }
      );

      res.status(200).json({
        success: true,
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl
        },
        message: 'Logged in successfully with Google!'
      });

    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Error authenticating with Google',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}
module.exports = registerController;
