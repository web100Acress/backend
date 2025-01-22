const postPropertyModel = require("../../../models/postProperty/post");
const buyCommercial_Model = require("../../../models/property/buyCommercial");
const rent_Model = require("../../../models/property/rent");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const { isValidObjectId } = require("mongoose");
const { uploadFile, deleteFile, updateFile  } = require("../../../Utilities/s3HelperUtility");
// const { url } = require("inspector");
require("dotenv").config();

AWS.config.update({
  secretAccessKey: process.env.AWS_S3_SECRET_ACESS_KEY,
  accessKeyId: process.env.AWS_S3_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const sendPostEmail = async (email) => {
  const transporter = await nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: process.env.Email,
      pass: process.env.EmailPass,
    },
    // debug: true // Enable debugging
  });
  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: "web.100acress@gmail.com", // Sender address
    to: "amit100acre@gmail.com", // List of receivers (admin's email) =='query.aadharhomes@gmail.com'
    subject: "New User Enquiry Detail", // Subject line
    text: "", // Plain text body
    html: `
       <div class="card">
        <div>
       <div class="header">
       <h2>Customer Contact Detail</h2>
       </div>
       </div>
       <center>
       <div>  Customer Contact  Detail:</div>
   
       <center>
   
        <br>
   
        </div>
   `,
  });
};

class rentController {
  //Insert
  static rentInsert = async (req, res) => {
    // res.send("listen rent insert ! ")
    try {
      // console.log("hello")
      const {
        propertyType,
        propertyName,
        price,
        area,
        availableDate,
        descripation,
        furnishing,
        builtYear,
        amenities,
        landMark,
        type,
        city,
        state,
        address,
      } = req.body;
      // console.log(req.body)

      if (
        !propertyType &&
        !propertyName &&
        !price &&
        !area &&
        !availableDate &&
        !descripation &&
        !furnishing &&
        !builtYear &&
        !amenities &&
        !landMark &&
        !type &&
        !city &&
        !state &&
        !address
      ) {
        return res.status(400).json({
          message: "check input field !",
        });
      }

      if (!req.files.frontImage && !req.files.otherImage) {
        return res.status(400).json({
          message: "check image field !",
        });
      }

      const imageData1 = await uploadFile(req.files.frontImage[0]);
      let imageData2 = [];
      if (req.files.otherImage) {
        imageData2 = await Promise.all(
          req.files.otherImage.map((file) => uploadFile(file))
        );
      }

      const data = new rent_Model({
        frontImage: {
          public_id: imageData1.Key,
          url: imageData1.Location,
        },
        otherImage: imageData2.map((item) => ({
          public_id: item.Key,
          url: item.Location,
        })),
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
        address: address,
      });
      await data.save();
      res.status(200).json({
        message: "Rental data insert successfully",
        dataRent: data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: "internal server error !",
      });
    }
  };
  //edit
  static rentEdit = async (req, res) => {
    // res.send("rent edit ")
    try {
      // console.log("edit")
      const id = req.params.id;
      if (id.length > 0) {
        const data = await rent_Model.findById({
          _id: id,
        });
        res.status(200).json({
          message: "Data get successfully !",
          dataEdit: data,
        });
      } else {
        res.status(201).json({
          message: "Id can not read ! ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: "Internal server error !",
      });
    }
  };
  // rental property view by id
  static rentView_id = async (req, res) => {
    // console.log("helllo")
    try {
      // console.log("hello")
      const id = req.params.id;
      if (id) {
        const data = await rent_Model.findById({ _id: id });

        const postData = await postPropertyModel.findOne(
          { "postProperty._id": id },
          {
            postProperty: {
              $elemMatch: {
                _id: id,
              },
            },
          }
        );
        //  const data1=postData.postProperty[0]
        if (data) {
          res.status(200).json({
            message: "data get successfully !",
            data: data,
          });
        } else {
          res.status(200).json({
            message: "data get successfully ! ",
            postData,
          });
        }
      } else {
        res.status(200).json({
          message: "data not found !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };
  //view
  static rentView = async (req, res) => {
    // res.send("listen  rent view ")
    try {
      // const id = req.params.id
      const type = req.params.type;
      const data = await rent_Model.find({ type: type });
      res.status(200).json({
        message: "Data get Successfully ! ",
        dataView: data,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  // ViewAll
  static rentViewAll = async (req, res) => {
    try {
      const data = await rent_Model.find();
      const data1 = await postPropertyModel.aggregate([
        {
          $match: {
            "postProperty.verify": "verified",
            "postProperty.propertyLooking": "rent",
          },
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
                    { $eq: ["$$property.verify", "verified"] },
                  ],
                },
              },
            },
          },
        },
      ]);
      const ost = data1.postProperty;
      const collectdata = [...data, ...data1];
      if (collectdata) {
        res.status(200).json({
          message: "data get successfully !",
          collectdata,
        });
      } else {
        res.status(200).json({
          message: "data not  found !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // rental property upadted api
  static rentUpdate = async (req, res) => {
    // res.send("listen rent  update ")
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
      }
      const {frontImage,otherImage } = req.files;
      const { propertyType,propertyName,city,state,address,price,area,availableDate,
        descripation,furnishing,builtYear,amenities,landmark, type,
      } = req.body;

      const data = await rent_Model.findById({ _id: id });
      if (data.length>0) {
        return res.status(400).json({
          message: "Not found csdcd !",
        });
      }
      const update = {}; // Initialize an empty object
      if (frontImage) {
        const frontobjectKey = data.frontImage.public_id;
        let frontResult = await updateFile(req.files.frontImage[0], frontobjectKey);
        update.frontImage = {
          public_id: frontResult.Key,
          url: frontResult.Location,
        };
      }
      if (otherImage) {
        let otherobjectKey =  data.otherImage.map((item) => {
          return item.public_id;
        });

        const otherResult = await Promise.all(
          otherImage.map((file, index) =>
            updateFile(file, otherobjectKey[index])
          ),
        );
        update.otherImage = otherResult.map((item) => ({
          public_id: item.Key,
          url: item.Location,
        }));
  
      }
      if (propertyType) {
        update.propertyType = propertyType;
      }
      if (propertyName) {
        update.propertyName = propertyName;
      }
      if (city) {
        update.city = city;
      }
      if (state) {
        update.state = state;
      }
      if (address) {
        update.address = address;
      }
      if (price) {
        update.price = price;
      }
      if (area) {
        update.area = area;
      }
      if (availableDate) {
        update.availableDate = availableDate;
      }
      if (descripation) {
        update.descripation = descripation;
      }
      if (furnishing) {
        update.furnishing = furnishing;
      }
      if (builtYear) {
        update.builtYear = builtYear;
      }
      if (amenities) {
        update.amenities = amenities;
      }
      if (landmark) {
        update.landMark = landmark;
      }
      if (type) {
        update.type = type;
      }
      const dataUpdate = await rent_Model.findByIdAndUpdate({_id:id},update );
      // console.log(dataUpdate)
      res.status(200).json({
        message: "update successfully !",
        dataUpdate,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // rental property delete api
  static rentDelete = async (req, res) => {
    try {
      // console.log("error ")
      const id = req.params.id;
      const image = await rent_Model.findById({ _id: id });
      const imageId = image.frontImage.public_id;

      await deleteFile(imageId);

      for (let i = 0; i < image.length; i++) {
        const otherResult = await rent_Model.findById({ _id: id });
        const otherId = otherResult.otherImage[i].public_id;
        await cloudinary.uploader.upload(otherId);
      }
      await rent_Model.findByIdAndDelete({ _id: id });

      res.status(200).json({
        message: " data deleted successfully !",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };

  // static email=async(req,res)=>{
  //     console.log("hello")
  //     try {
  //         // await sendPostEmail()
  //         console.log("hello email")
  //         const transporter = await nodemailer.createTransport({
  //             service:'gmail',
  //             port:465,
  //             secure:true,
  //             logger:true,
  //             debug:true,
  //             secureConnection:false,
  //             auth: {
  //                 // user: process.env.Email,
  //                 // pass: process.env.EmailPass
  //                 user:"web.100acress@gmail.com",
  //                 pass:"txww gexw wwpy vvda"
  //             },
  //             tls:{
  //                 rejectUnAuthorized:true
  //             }
  //             // debug: true // Enable debugging
  //         });
  //         // Send mail with defined transport object
  //         let info = await transporter.sendMail({
  //             from: "web.100acress@gmail.com", // Sender address
  //             to: 'amit100acre@gmail.com', // List of receivers (admin's email) =='query.aadharhomes@gmail.com'
  //             subject: 'New User Enquiry Detail', // Subject line
  //             text: '', // Plain text body
  //             html: `
  //             <div class="card">
  //              <div>
  //             <div class="header">
  //             <h2>Customer Contact Detail</h2>
  //             </div>
  //             </div>
  //             <center>
  //             <div>  Customer Contact  Detail:</div>

  //             <center>

  //              <br>

  //              </div>
  //         `,
  //         });
  //         res.send("sdhgiuhfiuweh" )
  //     } catch (error) {
  //       res.send(error,"dkwgd")
  //     }
  // }
}
module.exports = rentController;
