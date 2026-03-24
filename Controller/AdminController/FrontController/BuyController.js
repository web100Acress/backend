const postPropertyModel = require("../../../models/postProperty/post");
const buyCommercial_Model = require("../../../models/property/buyCommercial");
const cache = require("memory-cache");
require("dotenv").config();

const { isValidObjectId, default: mongoose } = require("mongoose");

const {
  uploadFile,
  deleteFile,
  updateFile,
} = require("../../../Utilities/s3HelperUtility");
class BuyController {
  // Buy Commercial Insert Edit View Update Delete
  static buycommercialInsert = async (req, res) => {
    try {
      const {
        propertyName,
        propertyType,
        availableDate,
        price,
        state,
        city,
        address,
        descripation,
        amenities,
        type,
        area,
        furnishing,
        landMark,
        builtYear,
      } = req.body;

      if (!req.files.frontImage && !req.files.otherImage) {
        return res.status(400).json({
          error: "check Images !",
        });
      }
      if (
        !propertyName &&
        !propertyType &&
        !availableDate &&
        !price &&
        !state &&
        !city &&
        !address &&
        !descripation &&
        !amenities &&
        !type &&
        !area &&
        !furnishing &&
        !landMark &&
        !builtYear
      ) {
        return res.status(400).json({
          error: "check input field !",
        });
      }
      const imageData1 = await uploadFile(req.files.frontImage[0]);
      // console.log("kgha")
      let imageData = [];
      if (req.files.otherImage) {
        imageData = await Promise.all(
          req.files.otherImage.map((file) => uploadFile(file)),
        );
      }
      const data = new buyCommercial_Model({
        frontImage: {
          public_id: imageData1.Key,
          url: imageData1.Location,
        },
        otherImage: imageData.map((item) => ({
          public_id: item.Key,
          url: item.Location,
        })),
        propertyName: propertyName,
        propertyType: propertyType,
        availabledate: availableDate,
        price: price,
        state: state,
        city: city,
        address: address,
        descripation: descripation,
        amenities: amenities,
        type: type,
        area: area,
        furnishing: furnishing,
        landMark: landMark,
        builtYear: builtYear,
      });
      // cconsole.log(data)
      await data.save();
      res.status(201).json({
        message: "data inserted successfully !",
        dataget: data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "internal server error  !",
      });
    }
  };

  // static viewAll = async (req, res) => {
  //     try {
  //         const data = await buyCommercial_Model.find()

  //         const data1 = await postPropertyModel.aggregate([
  //             {
  //                 $match: {
  //                     "postProperty.verify": "verified",
  //                     "postProperty.propertyLooking": "Sell"
  //                 }
  //             },
  //             {
  //                 $project: {
  //                     name: 1,
  //                     postProperty: {
  //                         $filter: {
  //                             input: "$postProperty",
  //                             as: "property",
  //                             cond: {
  //                                 $and: [
  //                                     { $eq: ["$$property.propertyLooking", "Sell"] },
  //                                     { $eq: ["$$property.verify", "verified"] }
  //                                 ]
  //                             }
  //                         }
  //                     }
  //                 }
  //             }
  //         ]);

  //         const collectdata=[...data,...data1]
  //         res.status(200).json({

  //             message: 'Data fetched from the database!',
  //             collectdata

  //         });
  //     } catch (error) {
  //         console.log(error)
  //         res.status(500).json({
  //             message: 'internal server error'
  //         })
  //     }
  // }
  // view by id
  static viewAll = async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.max(Math.min(parseInt(req.query.limit) || 100, 100), 1);
      const skip = (page - 1) * limit;

      // Use a more specific cache key for pagination
      const cacheKey = `buyData_p${page}_l${limit}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.status(200).json({
          message: "Data fetched from the cache!",
          ResaleData: cachedData.data,
          totalCount: cachedData.total
        });
      }

      // Get total count for pagination info
      const totalCount = await postPropertyModel.countDocuments({
        "postProperty.verify": "verified",
        "postProperty.propertyLooking": "Sell"
      });

      const data1 = await postPropertyModel.aggregate([
        {
          $unwind: "$postProperty"
        },
        {
          $match: {
            "postProperty.verify": "verified",
            "postProperty.propertyLooking": "Sell"
          }
        },
        {
          $sort: { "postProperty.createdAt": -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        },
        {
          $project: {
            _id: "$postProperty._id",
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
            bedrooms: "$postProperty.bedrooms",
            bathrooms: "$postProperty.bathrooms",
            city: "$postProperty.city",
            state: "$postProperty.state",
            address: "$postProperty.address",
            email: "$postProperty.email",
            number: "$postProperty.number",
            verify: "$postProperty.verify",
            propertyLooking: "$postProperty.propertyLooking"
          }
        }
      ]);

      const expirationTime = 5 * 60 * 1000; // 5 minutes
      cache.put(cacheKey, { data: data1, total: totalCount }, expirationTime);

      return res.status(200).json({
        message: "Data fetched from the database!",
        ResaleData: data1,
        totalCount: totalCount
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  };

  static buyView_id = async (req, res) => {
    try {
      const id = req.params.id;
      
      // Cache property details for 5 minutes
      const cacheKey = `buyDetail_${id}`;
      const cachedDetail = cache.get(cacheKey);
      if (cachedDetail) {
        return res.status(200).json({
          message: "data get successfully from cache!",
          data: cachedDetail,
        });
      }

      if (id) {
        const postData = await postPropertyModel.aggregate([
          {
            $match: {
              "postProperty._id": mongoose.Types.ObjectId.createFromHexString(id)
            }
          },
          {
            $unwind: "$postProperty"
          },
          {
            $match: {
              "postProperty._id": mongoose.Types.ObjectId.createFromHexString(id)
            }
          },
          {
            $project:{
              agentId: "$_id",
              agentName: "$name",
              agentEmail: "$email",
              agentNumber: "$postProperty.number",
              postProperty: "$postProperty"
            }
          }
        ]);
        
        if (postData.length > 0) {
          cache.put(cacheKey, postData[0], 5 * 60 * 1000);
          res.status(200).json({
            message: "data get successfully!",
            data: postData[0],
          });
        } else {
          res.status(404).json({
            message: "Property not found!",
          });
        }
      } else {
        res.status(404).json({
          message: "id does not found in url!",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "internal server error!",
      });
    }
  };

  static buycommercialEdit = async (req, res) => {
    try {
      const id = req.params.id;
      const data = await buyCommercial_Model.findById({ _id: id });
      res.status(200).json({
        message: "data get successfully !!",
        dataedit: data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "something went wrong ! ",
      });
    }
  };

  static buycommercialUpdate = async (req, res) => {
    // res.send("listen update")
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
      }
      const {
        propertyName,
        propertyType,
        availableDate,
        city,
        state,
        address,
        price,
        type,
        descripation,
        amenities,
        area,
        furnishing,
        landMark,
        builtYear,
      } = req.body;
      const { frontImage, otherImage } = req.files;

      const data = await buyCommercial_Model.findById({ _id: id });
      if (data.length > 0) {
        return res.status(400).json({
          message: "Not found csdcd !",
        });
      }
      const update = {}; // Initialize an empty object
      if (frontImage) {
        const frontobjectKey = data.frontImage.public_id;
        let frontResult = await updateFile(
          req.files.frontImage[0],
          frontobjectKey,
        );
        update.frontImage = {
          public_id: frontResult.Key,
          url: frontResult.Location,
        };
      }
      if (otherImage) {
        let otherobjectKey = data.otherImage.map((item) => {
          return item.public_id;
        });

        const otherResult = await Promise.all(
          otherImage.map((file, index) =>
            updateFile(file, otherobjectKey[index]),
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
      if (landMark) {
        update.landMark = landMark;
      }
      if (type) {
        update.type = type;
      }
      const dataUpdate = await buyCommercial_Model.findByIdAndUpdate(
        { _id: id },
        update,
      );
      // console.log(dataUpdate)
      res.status(200).json({
        message: "update successfully !",
        dataUpdate,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "something went wrong ! ",
      });
    }
  };

  static buycommercialDelete = async (req, res) => {
    try {
      const id = req.params.id;
      // console.log(id)
      // const data = await buyCommercial_Model.findByIdAndDelete(id)
      const result = await buyCommercial_Model.findById(req.params.id);
      const imageId = result.frontImage.public_id;
      await deleteFile(imageId);

      for (let i = 0; i < result.length; i++) {
        const otherResult = await buyCommercial_Model.findById(req.params.id);
        const otherId = otherResult.otherImage[i].public_id;
        await deleteFile(otherId);
      }

      await buyCommercial_Model.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: "data deleted successfully !",
        // datadelete: data
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "something went wrong ! ",
      });
    }
  };
}
module.exports = BuyController;
