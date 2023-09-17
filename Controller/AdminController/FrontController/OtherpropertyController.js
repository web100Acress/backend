const otherPropertyModel = require('../../../models/otherProperty/otherpropertyModel');

const cloudinary = require('cloudinary').v2;
class otherpropertyController {

  static otherproperty_Insert = async (req, res) => {
    try {
      const { propertyOwnerEmail, propertyOwnerNumber, propertyType, propertyName, address, city, state, price, area, descripation, landMark, amenities, builtYear, furnishing, type, availableDate } = req.body

      const frontImage = req.files.frontImage;
      const frontResult = await cloudinary.uploader.upload(
        frontImage.tempFilePath, {
        folder: "100acre/otherProperty"
      }
      )
      const otherImage = req.files.otherImage;
      const otherImagelink = []
      if (otherImage.length >= 2) {
        for (let i = 0; i < otherImage.length; i++) {
          const otherResult = await cloudinary.uploader.upload(
            otherImage[i].tempFilePath, {
            folder: "100acre/otherProperty"
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
          folder: "100acre/otherProperty"
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
        message: "internal server error ! "
      })
    }
  }
  static otherproperty_view = async (req, res) => {
    try {
      // console.log("hello")
      const id = req.params.id
      const data = await otherPropertyModel.find({ _id: id });
      // res.send(data)
      res.status(200).json({
        message: "data get !!"
      })
    } catch (error) {
      console.log(error)
      res.send(500).json({
        message: "internal server error ! "
      })
    }
  }
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
        message: "internal server error ! "
      })
    }
  }

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
        message: "internal server error ! "
      })
    }
  }
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
            folder: "100acre/otherProperty"
          }
          )

          if (otherImage.length >= 2) {
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
            folder: "100acre/otherProperty"
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

  await otherPropertyModel.findByIdAndDelete({_id:id})
  res.status(200).json({
    message:"delete successfully"
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