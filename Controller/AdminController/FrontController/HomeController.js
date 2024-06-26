//home controller  for handling operations routing
const buyCommercial_Model = require("../../../models/property/buyCommercial");
const rent_Model = require("../../../models/property/rent");
// const prelaunchModel=require("..")

const ProjectModel = require("../../../models/projectDetail/project");
const postPropertyModel = require("../../../models/postProperty/post");

class homeController {
  // search in buy and rent
  static search = async (req, res) => {
    const searchTerm = req.params.key;
    if (!searchTerm) {
      return res.status(200).json({
        message: "Please enter your query!",
      });
    }
    try {
      const searchResults = await Promise.all([
        buyCommercial_Model.find({
          $or: [
            { projectName: { $regex: searchTerm, $options: "i" } },
            { propertytype: { $regex: searchTerm, $options: "i" } },
            { address: { $regex: searchTerm, $options: "i" } },
            { city: { $regex: searchTerm, $options: "i" } },
          ],
        }),
        rent_Model.find({
          $or: [
            { projectName: { $regex: searchTerm, $options: "i" } },
            { propertytype: { $regex: searchTerm, $options: "i" } },
            { city: { $regex: searchTerm, $options: "i" } },
            { type: { $regex: searchTerm, $options: "i" } },
          ],
        }),
        ProjectModel.find({
          $or: [
            { projectName: { $regex: searchTerm, $options: "i" } },
            { city: { $regex: searchTerm, $options: "i" } },
            { builderName: { $regex: searchTerm, $options: "i" } },
          ],
        }),
        postPropertyModel.aggregate([
          {
            $match: {
              "postProperty.city": { $regex: searchTerm, $options: "i" },
              "postProperty.projectName": { $regex: searchTerm, $options: "i" },
              "postProperty.builderName": { $regex: searchTerm, $options: "i" },
            },
          },
          {
            $group: {
              _id: "$_id",
              name: { $first: "$name" },
              email: { $first: "$email" },
              mobile: { $first: "$mobile" },
              role: { $first: "$role" },
              token: { $first: "$token" },
              postProperty: { $push: "$postProperty" },
            },
          },
        ]),
      ]);

      const searchdata = searchResults.flat();

      if (searchdata.length > 0) {
        return res.status(200).json({
          message: "Data found-1!",
          searchdata,
        });
      } else {
        const words = searchTerm.split(" ");
        const searchPromises = [];
        words.forEach((word) => {
          searchPromises.push(
            buyCommercial_Model.find({
              $or: [
                { projectName: { $regex: word, $options: "i" } },
                { propertytype: { $regex: word, $options: "i" } },
                { address: { $regex: word, $options: "i" } },
                { city: { $regex: word, $options: "i" } },
              ],
            }),
            rent_Model.find({
              $or: [
                { projectName: { $regex: word, $options: "i" } },
                { propertytype: { $regex: word, $options: "i" } },
                { city: { $regex: word, $options: "i" } },
                { type: { $regex: word, $options: "i" } },
              ],
            }),
            ProjectModel.find({
              $or: [
                { projectName: { $regex: word, $options: "i" } },
                { city: { $regex: word, $options: "i" } },
                { builderName: { $regex: word, $options: "i" } },
              ],
            }),
            postPropertyModel.aggregate([
              {
                $match: {
                  "postProperty.city": { $regex: word, $options: "i" },
                  "postProperty.propertyName": { $regex: word, $options: "i" },
                  "postProperty.builderName": { $regex: word, $options: "i" },
                },
              },
              {
                $group: {
                  _id: "$_id",
                  name: { $first: "$name" },
                  email: { $first: "$email" },
                  mobile: { $first: "$mobile" },
                  role: { $first: "$role" },
                  token: { $first: "$token" },
                  postProperty: { $push: "$postProperty" },
                },
              },
            ])
          );
        });
        const searchResults = await Promise.all(searchPromises);
        const searchdata = searchResults.flat();

        if (searchdata.length > 0) {
          return res.status(200).json({
            message: "Data found-2!",
            searchdata,
          });
        } else {
          const data = await ProjectModel.find();
          return res.status(200).json({
            message: "No data found-3.",
            searchdata: data,
          });
        }
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  };
  //search for otherproperty
  static search_other = async (req, res) => {
    const { query } = req.query;
    console.log(query);
    //   console.log(query)
    if (query.length) {
      const words = query.split(" ");
      const searchData = [];
      try {
        // Split the query into an array of words
        for (let i = 0; i < words.length; i++) {
          let data = await otherPropertyModel.find({
            $or: [
              { propertyName: { $regex: words[i], $options: "i" } },
              { propertyType: { $regex: words[i], $options: "i" } },
              { address: { $regex: words[i], $options: "i" } },
            ],
          });
          if (data.length > 0) {
            searchData.push(...data);
          }
        }
        if (searchData.length > 0) {
          res.status(200).json({
            message: "Data found!",
            data: searchData,
          });
        } else {
          res.status(200).json({
            message: "Data not found!",
          });
        }
      } catch (error) {
        console.log(error);
        res.status(500).json({
          message: "internal server error ! ",
        });
      }
    }
  };
  //search in rental property
  static search_rent = async (req, res) => {
    // console.log("heloo")
    // console.log("listening the search rent ! ")
    const { query } = req.query;
    const words = query.split(" ");
    // console.log(words)
    try {
      for (let i = 0; i < words.length; i++) {
        // console.log(words[i])
        const data = await rent_Model.find({
          $or: [
            { projectName: { $regex: words[i], $options: "i" } },
            { propertyTitle: { $regex: words[i], $options: "i" } },
            { address: { $regex: words[i], $options: "i" } },
            { type: { $regex: words[i], $options: "i" } },
          ],
        });
        // console.log(data)
        const searchData = [];
        if (data.length > 0) {
          searchData.push(...data);
        }
      }

      if (searchData.length > 0) {
        res.status(200).json({
          message: "data found ! ",
          searchData,
        });
      } else {
        res.status(200).json({
          message: "data not found ! ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  //search in buy property

  static search_buy = async (req, res) => {
    try {
      const key = req.params.key;

      const data1 = await postPropertyModel.aggregate([
        {
          $match: {
            "postProperty.verify": "verified",
            "postProperty.propertyLooking": "Sell",
          },
        },
        {
          $project: {
            // name: 1,
            postProperty: {
              $filter: {
                input: "$postProperty",
                as: "property",
                cond: {
                  $and: [
                    { $eq: ["$$property.propertyLooking", "Sell"] },
                    { $eq: ["$$property.verify", "verified"] },
                    {
                      $or: [
                        {
                          $regexMatch: {
                            input: "$$property.propertyName",
                            regex: new RegExp(key, "i"),
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$$property.propertyType",
                            regex: new RegExp(key, "i"),
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$$property.address",
                            regex: new RegExp(key, "i"),
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$$property.city",
                            regex: new RegExp(key, "i"),
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$$property.price",
                            regex: new RegExp(key, "i"),
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $match: {
            "postProperty.0": { $exists: true }, // Ensure the array is not empty after filtering
          },
        },
      ]);

      if (data1.length > 0) {
        res.status(200).send({
          success: true,
          message: "data get successfully",
          data: data1,
        });
      } else {
        const data1 = await postPropertyModel.aggregate([
          {
            $match: {
              "postProperty.verify": "verified",
              "postProperty.propertyLooking": "Sell",
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
                      { $eq: ["$$property.propertyLooking", "Sell"] },
                      { $eq: ["$$property.verify", "verified"] },
                    ],
                  },
                },
              },
            },
          },
        ]);
        res.status(200).send({
          success: true,
          message: "data get successfully !",
          data: data1,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error!",
      });
    }
  };
  // filter data by projectname, city,buildername,minPrice,maxprice
  // type===residential and Commercial
  //area or state
  // furnishing === select box fully or semi furnished

  // static filter_data = async (req, res) => {
  //   try {

  //     const { projectName, city,
  //       builderName, minPrice, maxPrice, state, area, type, furnishing } = req.query;
  //     // console.log(projectName)

  //     const filter_data = []
  //     const query = {};
  //     //  filter according the state
  //     if (state) {
  //       query.state = { $regex: new RegExp(state, 'i') }
  //     }
  //     //filter according the area
  //     if (area) {
  //       query.area = { $regex: new RegExp(area, 'i') }
  //     }
  //     //filter according the type
  //     if (type) {
  //       query.type = { $regex: new RegExp(type, 'i') }
  //     }
  //     //filter according the furnishing
  //     if (furnishing) {
  //       query.furnishing = { $regex: new RegExp(furnishing, 'i') }
  //     }
  //     if (projectName) {
  //       query.projectName = { $regex: new RegExp(projectName, 'i') };
  //     }
  //     if (city) {
  //       query.city = { $regex: new RegExp(city, 'i') };
  //     }
  //     // if selected buildrname
  //     if (builderName) {
  //       query.builderName = { $regex: new RegExp(builderName, 'i') }
  //     }

  //     //for less tha price or greater than price filter
  //     if (minPrice != 0) {
  //       const price = minPrice;
  //       if (price) {
  //         query.price = { $gte: parseInt(price) }
  //       }
  //     }
  //     if (maxPrice != 0) {
  //       const price = maxPrice
  //       if (price) {
  //         query.price = { $lte: parseInt(price) }
  //       }
  //     }

  //     // if selected both minPrice and maxPrice then excute this portion
  //     if (minPrice && maxPrice) {
  //       if (minPrice != 0 || maxPrice != 0) {
  //         query.price = {};

  //         if (minPrice != 0) {
  //           const price = maxPrice
  //           if (price) {
  //             query.price.$lte = parseInt(price)
  //           }

  //         }

  //         if (maxPrice != 0) {
  //           const price = minPrice
  //           if (price) {
  //             query.price.$gte = parseInt(price)
  //           }
  //         }
  //       }
  //     }

  //     // if query is get
  //     if (query) {
  //       const buy = await buyCommercial_Model.find(query)
  //       const items1 = await rent_Model.find(query);
  //       const items = await prelaunchModel.find(query);

  //       const data = [...items, ...items1, ...buy]

  //       if (data.length > 0) {
  //         filter_data.push(...data)
  //       }
  //       res.status(200).json({
  //         message: "data filtered",
  //         filter_data
  //       })
  //     } else {
  //       res.status(403).json({
  //         message: "please select field for filter data !"
  //       })
  //     }
  //   } catch (error) {
  //     console.log(error)
  //     res.status(500).json({
  //       message: "internal server error "
  //     })
  //   }
  // }

  
  static filter_data = async (req, res) => {
    try {
      const {
        propertyName,
        state,
        city,
        price,
        area,
        address,
        furnishing,
        propertyType,
      } = req.query;

      const filterConditions = [];

      if (propertyType) {
        const propertyTypes = propertyType.split(" ");

        const regexPattern = propertyTypes.join("|"); // "Residential|Commercial"
        const regex = new RegExp(regexPattern, "i"); // Case-insensitive regex
        filterConditions.push({
          $regexMatch: { input: "$$property.propertyType", regex: regex },
        });
        // filterConditions.push({ $regexMatch: { input: "$$property.propertyType", regex: new RegExp({ $in: regex }) } });
      }
      if (propertyName) {
        filterConditions.push({
          $regexMatch: {
            input: "$$property.propertyName",
            regex: new RegExp(propertyName, "i"),
          },
        });
      }
      if (state) {
        filterConditions.push({
          $regexMatch: {
            input: "$$property.state",
            regex: new RegExp(state, "i"),
          },
        });
      }
      if (city) {
        filterConditions.push({
          $regexMatch: {
            input: "$$property.city",
            regex: new RegExp(city, "i"),
          },
        });
      }
      if (price) {
        filterConditions.push({
          $regexMatch: {
            input: "$$property.price",
            regex: new RegExp(price, "i"),
          },
        });
      }
      if (area) {
        filterConditions.push({
          $regexMatch: {
            input: "$$property.area",
            regex: new RegExp(area, "i"),
          },
        });
      }
      if (address) {
        filterConditions.push({
          $regexMatch: {
            input: "$$property.address",
            regex: new RegExp(address, "i"),
          },
        });
      }
      const data1 = await postPropertyModel.aggregate([
        {
          $match: {
            "postProperty.verify": "verified",
            "postProperty.propertyLooking": "Sell",
          },
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
                    { $eq: ["$$property.verify", "verified"] },
                    ...filterConditions,
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            postProperty: {
              $map: {
                input: "$postProperty",
                as: "property",
                in: {
                  $mergeObjects: [
                    "$$property",
                    { name: "$name", role: "$role" },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            name: 0, // Remove name from root level
            role: 0,
            // postproperty:1
            // Remove role from root level
          },
        },
      ]);

      // const collectdata = [...data1];
      const collectdata = [...data1].filter(
        (item) => item.postProperty.length > 0
      );

      res.status(200).json({
        message: "Data fetched from the database!",
        collectdata,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  };

  static dataSnapshot = async (req, res) => {
    try {
      // Count PostProperty data
      const postDat = await postPropertyModel.find();

      let total = 0;
      let rent = 0;
      let sell = 0;
      for (let postData of postDat) {
        const data = postData.postProperty;
        for (let property of data) {
          if (property.propertyLooking === "rent") {
            rent++; // Increment rent count if type is "rent"
          } else {
            sell++;
          }
        }
        const count = data.length;
        if (count != 0) {
          total = total + count;
        }
      }
      // Count ProjectData
      const buyCount = (await buyCommercial_Model.find()).length;
      const BuyTotal = (buyCount + sell) * 10;

      const rentCount = (await rent_Model.find()).length;
      const torent = (rentCount + rent) * 10;

      const projectCount = (await ProjectModel.find()).length;

      res.status(200).json({
        message: "data get successfull !",
        totalUser: total * 10,
        totalRentposted: rent * 10,
        totalSellposted: sell * 10,

        buyAddon: BuyTotal,
        total: torent,
        totalProject: projectCount * 15,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  // ///////////////////
}
module.exports = homeController;
