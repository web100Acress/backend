const postPropertyModel = require('../../../models/postProperty/post');
const buyCommercial_Model = require('../../../models/property/buyCommercial');
const NodeCache = require("node-cache");
const cache = require("memory-cache");
require('dotenv').config()

const { isValidObjectId } = require('mongoose');
const {uploadFile, deleteFile,updateFile} = require("../../../Utilities/s3HelperUtility");
// AWS.config.update({
//     secretAccessKey: process.env.AWS_S3_SECRET_ACESS_KEY,
//     accessKeyId: process.env.AWS_S3_ACCESS_KEY,
//     region: process.env.AWS_REGION,
// })
// const s3=new AWS.S3()

// const uploadFile=(file)=>{

//     const fileContent=fs.readFileSync(file.path)

//     const params={
//         Bucket:"100acress-media-bucket",
//         Body:fileContent,
//         Key:`uploads/${Date.now()}-${file.originalname}`,
//         ContentType:file.mimetype

//     }
//     return s3.upload(params).promise();

// }
// const updateRent = (file, objectKey) => {
//     const fileContent = fs.readFileSync(file.path);
//     if (objectKey != null) {
//       const params = {
//         Bucket: "100acress-media-bucket",
//         Key: objectKey,
//         Body: fileContent,
//         ContentType: file.mimetype,
//       };
//       return s3.upload(params).promise();
//     } else {
//       const params = {
//         Bucket: "100acress-media-bucket", // You can use environment variables for sensitive data like bucket name
//         Key: `uploads/${Date.now()}-${file.originalname}`, // Store the file with a unique name in the 'uploads/' folder
//         Body: fileContent,
//         ContentType: file.mimetype,
//       };
  
//       // Return the promise from s3.upload
//       return s3.upload(params).promise();
//     }
//   };

class BuyController {
    // Buy Commercial Insert Edit View Update Delete
    static buycommercialInsert = async (req, res) => {
        try {
            const{propertyName,propertyType,availableDate,price, state,city,address,descripation,
                 amenities,type,area, furnishing,landMark,builtYear}=req.body
        
                 if(!req.files.frontImage&&!req.files.otherImage){
                    return res.status(400).json({
                        error:"check Images !"
                    })
                }
                 if(!propertyName&&!propertyType&&!availableDate&&!price&&!state&&!city&&!address&&!descripation&&
                    !amenities&&!type&&!area&&!furnishing&&!landMark&&!builtYear){
                        return res.status(400).json({
                            error:"check input field !"
                        })
                    }
                   const imageData1= await uploadFile(req.files.frontImage[0])
                // console.log("kgha")
                let imageData=[];
                if(req.files.otherImage){
                    imageData=await Promise.all(
                        req.files.otherImage.map((file)=>
                        uploadFile(file)
                        )
                    )
                }
                    const data = new buyCommercial_Model({
                        frontImage: {
                            public_id:imageData1.Key,
                            url:imageData1.Location 
                        },
                        otherImage:imageData.map((item)=>({
                            public_id:item.Key,
                            url:item.Location
                        })),
                        propertyName:propertyName,
                        propertyType:propertyType,
                        availabledate:availableDate,
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
                        builtYear: builtYear

                    })
                    // cconsole.log(data)
                    await data.save()
                    res.status(201).json({
                        message: "data inserted successfully !",
                        dataget: data
                    })
           
        } catch (error) {
            console.log(error)
          return res.status(500).json({
                error: "internal server error  !"
            })
        }

    }

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
          // Check if data is in cache
          const cachedData = cache.get("buyData");
          if (cachedData) {
            return res.status(200).json({
              message: 'Data fetched from the cache!',
              collectdata: cachedData
            });
          }
    
          // Fetch data from the database
          const data1 = await postPropertyModel.aggregate([
            {
              $match: {
                "postProperty.verify": "verified",
                "postProperty.propertyLooking": "Sell"
              }
            },
            {
              $project: {
                name: 1, // Include name
                role: 1, // Include role
                postProperty: {
                  $filter: {
                    input: "$postProperty",
                    as: "property",
                    cond: {
                      $and: [
                        { $eq: ["$$property.propertyLooking", "Sell"] },
                        { $eq: ["$$property.verify", "verified"] }
                      ]
                    }
                  }
                }
              }
            },
            {
              $addFields: {
                "postProperty": {
                  $map: {
                    input: "$postProperty",
                    as: "property",
                    in: {
                      $mergeObjects: ["$$property", { name: "$name", role: "$role" }]
                    }
                  }
                }
              }
            },
            {
              $project: {
                name: 0, // Remove name from root level
                role: 0 // Remove role from root level
              }
            }
          ]);
          
          // const data1 = 
          //   await postPropertyModel.aggregate([
          //     {
          //       $match: {
          //         "postProperty.verify": "verified",
          //         "postProperty.propertyLooking": "Sell"
          //       }
          //     },
          //     {
          //       $unwind: "$postProperty"
          //     },
          //     {
          //       $match: {
          //         "postProperty.verify": "verified",
          //         "postProperty.propertyLooking": "Sell"
          //       }
          //     },
          //     {
          //       $project: {
          //         _id: "$postProperty._id",
          //         propertyName: "$postProperty.propertyName",
          //         price: "$postProperty.price",
          //         area: "$postProperty.area",
          //         type: "$postProperty.type",
          //         furnishing: "$postProperty.furnishing",
          //         amenities: "$postProperty.amenities",
          //         city: "$postProperty.city",
          //         state: "$postProperty.state",
          //         address: "$postProperty.address",
          //         contact: {
          //           email: "$postProperty.email",
          //           number: "$postProperty.number",
          //           name: "$postProperty.name"
          //         },
          //         frontImage: "$postProperty.frontImage.url",
          //         otherImages: "$postProperty.otherImage",
          //         description: "$postProperty.descripation",
          //         landMark: "$postProperty.landMark",
          //         propertyType: "$postProperty.propertyType",
          //         role: "$postProperty.role",
          //         availableDate: "$postProperty.availableDate"
          //       }
          //     }
          //   ]);

          const collectdata = [...data1];

          const expirationTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    
          // Store the data in cache
          cache.put("buyData", collectdata, expirationTime);
    
          // Send the response with the fetched data
          res.status(200).json({
            message: 'Data fetched from the database!',
            collectdata: collectdata
          });
        } catch (error) {
          console.log(error);
          res.status(500).json({
            message: 'Internal server error'
          });
        }
      };
      
    static buyView_id = async (req, res) => {
        try {
            const id = req.params.id;
            if (id) {
                const data = await buyCommercial_Model.findById({ _id: id })
                const postData= await postPropertyModel.findOne({ "postProperty._id": id },
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
                        message: "data get successfully !! ",
                        data
                    })
                } else {
                    res.status(200).json({
                        message: "data get  successfully ! ",
                        postData
                    })
                }
            }else{
                res.status(404).json({
                    message:"id does not found in url !"
                })
            }

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! "
            })
        }
    }
 
    //    res.send('search with name and type')
    // static view_Name_type = async (req, res) => {
    //     try {

    //         const propertyName = req.params.propertyName;
    //         const type = req.params.type;
    //         const query = { propertyName: propertyName, type: type };
    //         const data = await buyCommercial_Model.find(query)
    //         res.status(200).json({
    //             message: "data get succesfull",
    //             data: data
    //         })

    //     } catch (error) {
    //         console.log(error)
    //         res.status(500).json({
    //             message: "something went wrong ! ",
    //         })
    //     }
    // }


    static buycommercialEdit = async (req, res) => {
        try {
            const id = req.params.id
            const data = await buyCommercial_Model.findById({_id:id})
            res.status(200).json({
                message: "data get successfully !!",
                dataedit: data
            })

        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "something went wrong ! "
            })
        }
    }

    static buycommercialUpdate = async (req, res) => {
        // res.send("listen update")
        try {

            const id=req.params.id;
            if(isValidObjectId(id)){} 
            const {propertyName, propertyType, availableDate, city, state, address, price, type, descripation, amenities, area, furnishing, landMark, builtYear } = req.body
            const {frontImage,otherImage } = req.files;
        
        
           const data = await buyCommercial_Model.findById({ _id: id });
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
           if (landMark) {
             update.landMark = landMark;
           }
           if (type) {
             update.type = type;
           }
           const dataUpdate = await buyCommercial_Model.findByIdAndUpdate({_id:id},update );
           // console.log(dataUpdate)
           res.status(200).json({
             message: "update successfully !",
             dataUpdate,
           });
                
           
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "something went wrong ! "
            })
        }
    }

    static buycommercialDelete = async (req, res) => {
        try {
            const id = req.params.id;
            // console.log(id)
            // const data = await buyCommercial_Model.findByIdAndDelete(id)
            const result = await buyCommercial_Model.findById(req.params.id)
            const imageId = result.frontImage.public_id
            await deleteFile(imageId)

            for (let i = 0; i < result.length; i++) {
                const otherResult = await buyCommercial_Model.findById(req.params.id)
                const otherId = otherResult.otherImage[i].public_id
                await deleteFile(otherId)
            }

            await buyCommercial_Model.findByIdAndDelete(req.params.id)

            res.status(200).json({
                message: "data deleted successfully !",
                // datadelete: data
            })
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "something went wrong ! "
            })
        }
    }

}
module.exports = BuyController
