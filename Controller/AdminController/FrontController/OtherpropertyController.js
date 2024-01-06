const otherEnquiryModel = require('../../../models/otherProperty/otherpropertyEnquiry');
const otherPropertyModel = require('../../../models/otherProperty/otherpropertyModel');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const NodeCache = require("node-cache");
const cache = new NodeCache();

class otherpropertyController {
  //  otherproperty data insert
  static otherproperty_Insert = async (req, res) => {
    try {
      const { propertyOwnerEmail, propertyOwnerNumber, propertyType, propertyName, address, city, state, price, area, descripation, landMark, amenities, builtYear, furnishing, type, availableDate } = req.body

      const frontImage = req.files.frontImage;
      const frontResult = await cloudinary.uploader.upload(
        frontImage.tempFilePath, {
        folder: `100acre/otherProperty/${propertyName}`
      }
      )
      const otherImage = req.files.otherImage;
      const otherImagelink = []
      if (otherImage.length >= 2) {
        for (let i = 0; i < otherImage.length; i++) {
          const otherResult = await cloudinary.uploader.upload(
            otherImage[i].tempFilePath, {
            folder: `100acre/otherProperty/${propertyName}`
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
          folder: `100acre/otherProperty/${propertyName}`
        }
        );
        otherImagelink.push({
          public_id: otherResult.public_id,
          url: otherResult.secure_url
        })

      }

      const data = new otherPropertyModel({
        propertyOwnerEmail: propertyOwnerEmail,
        propertyOwnerNumber: propertyOwnerNumber,
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
      })
      // console.log(data)
      await data.save()

      res.status(200).json({
        message: "data submit successfully ! "
      })
    } catch (error) {
      console.log(error)
      res.send(500).json({
        message: "Internal server error ! "
      })
    }
  }
  // otherproperty data view 
  static otherproperty_view = async (req, res) => {
    try {
      // console.log("hello")
      const id = req.params.id
      const data = await otherPropertyModel.find({ _id: id });
      // res.send(data ,"message")
      res.status(200).json({
        message: "data get!"
      })
    } catch (error) {
      console.log(error)
      res.send(500).json({
        message: "Internal server error ! "
      })
    }
  }
  // otherproperty data viewAll
  static otherproperty_viewAll = async (req, res) => {
    // console.log("hello")
    try {
      const data = await otherPropertyModel.find()
      res.status(200).json({
        message: "All data get successfully",
        data
      })

    } catch (error) {
      console.log(error)
      res.send(500).json({
        message: "Internal server error ! "
      })
    }
  }
  // otherproperty data edit
  static otherproperty_edit = async (req, res) => {
    try {
      // console.log("hello")
      const id = req.params.id
      const data = await otherPropertyModel.find({ _id: id });
      // res.send(data)
      res.status(200).json({
        message: "data get !",
        data
      })
    } catch (error) {
      console.log(error)
      res.send(500).json({
        message: "Internal server error! "
      })
    }
  }
  //otherproperty update
  static otherproperty_update = async (req, res) => {
    try {
      // console.log("hello")
      const { propertyOwnerEmail, propertyOwnerNumber, propertyName, propertyType, address, area, city, state, price, descripation, furnishing, builtYear, type, amenities, landMark, availableDate, } = req.body
      if (req.files) {
        if (req.files.frontImage && req.files.otherImage) {
          const frontImage = req.files.frontImage;
          const otherImage = req.files.otherImage;

          const otherImageLink = []

          const id = req.params.id;
          const data = await otherPropertyModel.findOne({ _id: id })
          // console.log(data)
          const frontId = data.frontImage.public_id
          await cloudinary.uploader.destroy(frontId)
          const frontResult = await cloudinary.uploader.upload(
            frontImage.tempFilePath, {
            folder: `100acre/otherProperty/${propertyName}`
          }
          )

          if (otherImage.length >= 2) {
            for (let i = 0; i < otherImage.length; i++) {
              const otherResult = await cloudinary.uploader.upload(
                otherImage[i].tempFilePath, {
                folder: `100acre/otherProperty/${propertyName}`
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
              folder: `100acre/otherProperty/${propertyName}`
            }
            );
            otherImageLink.push({
              public_id: otherResult.public_id,
              url: otherResult.secure_url
            })

          }
          const dataUpdate = new otherPropertyModel({
            propertyOwnerEmail: propertyOwnerEmail,
            propertyOwnerNumber: propertyOwnerNumber,
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
            otherImage: otherImageLink
          })
          // console.log(dataUpdate)
          await dataUpdate.save()
          res.status(200).json({
            message: "data updated successfully"
          })

        } else if (req.files.frontImage) {
          const frontImage = req.files.frontImage;
          const id = req.params.id;
          const data = await otherPropertyModel.findOne({ _id: id })
          const frontId = data.frontImage.public_id
          await cloudinary.uploader.destroy(frontId)
          const frontResult = await cloudinary.uploader.upload(
            frontImage.tempFilePath, {
            folder: `100acre/otherProperty/${propertyName}`
          }
          )
          const dataUpdate = new otherPropertyModel({
            propertyOwnerEmail: propertyOwnerEmail,
            propertyOwnerNumber: propertyOwnerNumber,
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
          })
          // console.log(dataUpdate)
          await dataUpdate.save()
          res.status(200).json({
            message: "dataUpdated successfully ,"
          })

        } else if (req.files.otherImage) {
          const otherImage = req.files.otherImage;
          const otherImageLink = []

          // const id = req.params.id;


          if (otherImage.length >= 2) {

            // const data = await otherPropertyModel.findOne({ _id: id })
            for (let i = 0; i < otherImage.length; i++) {
              const otherResult = await cloudinary.uploader.upload(
                otherImage[i].tempFilePath, {
                folder: "100acre/otherProperty"
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
              folder: "100acre/otherProperty"
            }
            );
            otherImageLink.push({
              public_id: otherResult.public_id,
              url: otherResult.secure_url
            })

          }
          const result = await otherPropertyModel.findById(req.params.id)
          for (let i = 0; i < result.otherImage.length; i++) {
            otherImageLink.push(
              result.otherImage[i]
            );
          }

          const dataUpdate = new otherPropertyModel({
            propertyOwnerEmail: propertyOwnerEmail,
            propertyOwnerNumber: propertyOwnerNumber,
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
            otherImage: otherImageLink
          })
          // console.log(dataUpdate)
          await dataUpdate.save()
          res.status(200).json({
            message: "dataUpdated successfully ,"
          })
        }
      } else {
        const dataUpdate = new otherPropertyModel({
          propertyOwnerEmail: propertyOwnerEmail,
          propertyOwnerNumber: propertyOwnerNumber,
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
        })
        // console.log(dataUpdate)
        await dataUpdate.save()
        res.status(200).json({
          message: "dataUpdated successfully !,"
        })
      }
    } catch (error) {
      console.log(error)
      res.send(500).json({
        message: "internal server error ! "
      })
    }
  }
  // otherproperty delete
  static otherproperty_delete = async (req, res) => {
    try {
      // console.log(data)
      const id = req.params.id;
      const data = await otherPropertyModel.findOne({ _id: id })
      const frontId = data.frontImage.public_id;
      // console.log(frontId)
      if (frontId != null) {
        await cloudinary.uploader.destroy(frontId);
      }

      const otherImage = data.otherImage

      for (let i = 0; i < otherImage.length; i++) {

        const frontId = data.otherImage[i].public_id;
        if (frontId != null) {
          await cloudinary.uploader.destroy(frontId)
        }

      }

      await otherPropertyModel.findByIdAndDelete({ _id: id })
      res.status(200).json({
        message: "delete successfully"
      })

    } catch (error) {
      console.log(error)
      res.send(500).json({
        message: "internal server error ! "
      })
    }
  }
  // other property Enquiry 
  static otherEnquiry_insert = async (req, res) => {
    // console.log("hello")
    try {
      // res.send("dsdoojo;whojosd")
      const { sellerEmail, SellermobileNumber, cust_Name, cust_Email, cust_Number, propertyName, address, status } = req.body
      // console.log(req.body)
      if (cust_Email && cust_Number) {
        const data = new otherEnquiryModel({
          sellerEmail: sellerEmail,
          SellermobileNumber: SellermobileNumber,
          cust_Email: cust_Email,
          cust_Number: cust_Number,
          cust_Name: cust_Name,
          propertyName: propertyName,
          Prop_address: address,
          status: status
        })
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
          to: 'query.adharhomes@gmail.com', // List of receivers (admin's email) =='query.aadharhomes@gmail.com'
          subject: 'New User Enquiry Detail', // Subject line
          text: '', // Plain text body
          html: `
          <div class="card">
          <div>
          <div class="header">
          <h2> Customer Contact Detail Enquiry other property !</h2>
          </div>
          </div>
          <center>
          <div>Customer Contact  Detail:</div>
          <div><h3>Seller Email:${data.sellerEmail}</h3></div>
          <div><h3>Seller Contact :${data.SellermobileNumber}</h3></div>
          <div><h3>Customer Email.:${data.cust_Email}</h3></div>
          <div><h3>Customer Name:${data.cust_Name}</h3></div>
          <div><h3>Customer Contact:${data.cust_Number}</h3></div>
          <div><h3>Property Address:${data.Prop_address}</h3></div>
          <center>

         <br>

         </div>
`,
        });
        //  console.log(data)
        await data.save()
        res.status(200).json({
          message: "data submitted successfully ! ",
          data
        })
      } else {
        res.status(403).json({
          message: "check input box !  "
        })
      }
    } catch (error) {
      console.log(error)
      res.status(500).json({
        message: "internal server error ! "
      })
    }
  }
  // other property Enquiry update
  static otherEnquiry_Update = async (req, res) => {
    // console.log("hello")
    try {
      const { sellerEmail, SellermobileNumber, cust_Name, cust_Email, cust_Number, propertyName, address, status } = req.body
      if (status != null) {
        // console.log("hello")
        const id = req.params.id

        const data = await otherEnquiryModel.findByIdAndUpdate({ id: id }, {
          sellerEmail: sellerEmail,
          SellermobileNumber: SellermobileNumber,
          cust_Name: cust_Name,
          cust_Email: cust_Email,
          cust_Number: cust_Number,
          propertyName: propertyName,
          address: address,
          status: status,
        })
        // console.log(data)
        await data.save()
        res.status(200).json({
          message:" data updated successfully ! "
        })

      } else {
        res.status(201).json({
          message: "done "
        })
      }

    } catch (error) {
      res.status(500).json({
        message: "Internal server error ! "
      })
    }
  }
  // other property Enquiry viewAll
  static otherEnquiry_viewAll = async (req, res) => {
    try {
      const cachedData = cache.get('authorData');
      if (cachedData) {
        // If data is in cache, return cached data
        return res.json({
          data: cachedData,
          message: 'Data retrieved from cache!',
        });
      }
      // If data is not in cache,fetch from the database
      const data = await rent_Model.find()
      // Store data in the cache for future use
      cache.set('authorData',data);
      res.status(200).json({
        data,
        message: 'Data fetched from the database !',
      });
    } catch (error) {
      console.log(error)
      res.status(500).json({
        message: "internal server error ! "
      })
    }
  }
  // other property Enquiry view 
  static otherEnquiry_view = async (req, res) => {
    // console.log("hello")
    try {
      // res.send("jjj")
      const id = req.params.id
      // console.log(id)
      const data = await otherEnquiryModel.findById(id)
      // res.send(data)
      res.status(200).json({
        message: "data get successfully !",
        data
      })
    } catch (error) {
      console.log(error)
      res.status(500).json({
        message: "internal server error "
      })
    }
  }
// other property Enquiry delete
  static otherEnquiry_delete = async (req, res) => {
    try {
      // console.log("hello")
      const id = req.params.id
      // console.log(id)
      const data = await otherEnquiryModel.findOneAndDelete({ _id: id })
      res.status(200).json({
        message: "data deleted successfully ! ",
        data
      })
    } catch (error) {
      console.log(error)
      res.send(500).json({
        message: "internal server error ! "
      })
    }
  }

}
module.exports = otherpropertyController 