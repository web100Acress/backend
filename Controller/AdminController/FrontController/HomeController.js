//home controller  for handling operations routing
const buyCommercial_Model = require("../../../models/property/buyCommercial");
const rent_Model = require("../../../models/property/rent");
// const prelaunchModel=require("..")

const ProjectModel = require("../../../models/projectDetail/project");
const postPropertyModel = require("../../../models/postProperty/post");
const UserModel = require("../../../models/projectDetail/user");
const nodemailer = require("nodemailer");
const LeadModel = require("../../../models/projectDetail/website");
const cache = require("memory-cache");
const tarnsporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: "officialhundredacress@gmail.com",
    pass: "txww gexw wwpy vvda",
  },
  tls: {
    rejectUnauthorized: true,
  },
});
class homeController {
  // search in buy and rent
  static search = async (req, res) => {
    const searchTerm = req.params.key;
    if (!searchTerm) {
      return res.status(400).json({
        message: "Please enter your query!",
      });
    }

    // Generate a unique cache key for the search term
    const cacheKey = `findData:${searchTerm}`;

    // Check if the data is in cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        message: "Data found in cache!",
        searchdata: JSON.parse(cachedData),
      });
    }

    try {
      // First try the text search
      const searchResults = await ProjectModel.find({
        $text: { $search: searchTerm },
      })
        .limit(16)
        .lean();

      // Cache the results if found
      if (searchResults.length > 0) {
        const time = 3 * 60 * 1000; // Cache for 3 minutes
        cache.put(cacheKey, JSON.stringify(searchResults), time);
        return res.status(200).json({
          message: "Data found-1!",
          searchdata: searchResults,
        });
      } else {
        // If no results, split the search term and perform regex search
        const words = searchTerm.split(" ");
        const searchPromises = words.map((word) => {
          return ProjectModel.find({
            $or: [
              { projectName: { $regex: word, $options: "i" } },
              { project_discripation: { $regex: word, $options: "i" } },
            ],
          }).lean();
        });

        const regexResults = await Promise.all(searchPromises);
        const combinedResults = [...new Set(regexResults.flat())]; // Remove duplicates

        // Cache the results from regex search
        if (combinedResults.length > 0) {
          const time = 3 * 60 * 1000; // Cache for 3 minutes
          cache.put(cacheKey, JSON.stringify(combinedResults), time);
          return res.status(200).json({
            message: "Data found-2!",
            searchdata: combinedResults,
          });
        }

        return res.status(404).json({ message: "No data found!" });
      }
    } catch (error) {
      console.error("Search error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Search suggestions for autocomplete
  static searchSuggestions = async (req, res) => {
    try {
      const query = req.params.query;
      if (!query || query.length < 1) {
        return res.status(200).json({ suggestions: [] });
      }

      const suggestions = [];
      const limit = 15; // Increased limit for more suggestions

      // Get suggestions from projects (main search)
      const projectSuggestions = await ProjectModel.find({
        $or: [
          { projectName: { $regex: query, $options: "i" } },
          { projectAddress: { $regex: query, $options: "i" } },
          { city: { $regex: query, $options: "i" } },
          { builderName: { $regex: query, $options: "i" } },
          { state: { $regex: query, $options: "i" } },
          { project_discripation: { $regex: query, $options: "i" } }
        ]
      })
      .limit(limit)
      .select('projectName projectAddress city builderName state project_url project_discripation')
      .lean();

      // Get suggestions from buy properties with enhanced search
      const buySuggestions = await postPropertyModel.aggregate([
        {
          $match: {
            "postProperty.verify": "verified",
            "postProperty.propertyLooking": "Sell"
          }
        },
        {
          $project: {
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
                        { $regexMatch: { input: "$$property.propertyName", regex: new RegExp(query, "i") } },
                        { $regexMatch: { input: "$$property.address", regex: new RegExp(query, "i") } },
                        { $regexMatch: { input: "$$property.city", regex: new RegExp(query, "i") } },
                        { $regexMatch: { input: "$$property.state", regex: new RegExp(query, "i") } },
                        { $regexMatch: { input: "$$property.area", regex: new RegExp(query, "i") } }
                      ]
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $limit: limit
        },
        {
          $project: {
            "postProperty.propertyName": 1,
            "postProperty.address": 1,
            "postProperty.city": 1,
            "postProperty.state": 1,
            "postProperty.area": 1,
            "postProperty.price": 1
          }
        }
      ]);

      // Get suggestions from rent properties with enhanced search
      const rentSuggestions = await postPropertyModel.aggregate([
        {
          $match: {
            "postProperty.verify": "verified",
            "postProperty.propertyLooking": "rent"
          }
        },
        {
          $project: {
            postProperty: {
              $filter: {
                input: "$postProperty",
                as: "property",
                cond: {
                  $and: [
                    { $eq: ["$$property.propertyLooking", "rent"] },
                    { $eq: ["$$property.verify", "verified"] },
                    {
                      $or: [
                        { $regexMatch: { input: "$$property.propertyName", regex: new RegExp(query, "i") } },
                        { $regexMatch: { input: "$$property.address", regex: new RegExp(query, "i") } },
                        { $regexMatch: { input: "$$property.city", regex: new RegExp(query, "i") } },
                        { $regexMatch: { input: "$$property.state", regex: new RegExp(query, "i") } },
                        { $regexMatch: { input: "$$property.area", regex: new RegExp(query, "i") } }
                      ]
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $limit: limit
        },
        {
          $project: {
            "postProperty.propertyName": 1,
            "postProperty.address": 1,
            "postProperty.city": 1,
            "postProperty.state": 1,
            "postProperty.area": 1,
            "postProperty.price": 1
          }
        }
      ]);

      // Process project suggestions with enhanced details
      projectSuggestions.forEach(project => {
        if (project.projectName) {
          let subtitle = '';
          if (project.city) subtitle += project.city;
          if (project.state && project.city) subtitle += `, ${project.state}`;
          if (!subtitle && project.projectAddress) subtitle = project.projectAddress;

          suggestions.push({
            text: project.projectName,
            type: 'project',
            url: `/${project.project_url}/`,
            subtitle: subtitle || 'Project',
            description: project.project_discripation ? project.project_discripation.substring(0, 100) + '...' : undefined
          });
        }
      });

      // Process buy suggestions with enhanced details
      buySuggestions.forEach(item => {
        if (item.postProperty && item.postProperty.propertyName) {
          let subtitle = '';
          if (item.postProperty.city) subtitle += item.postProperty.city;
          if (item.postProperty.state && item.postProperty.city) subtitle += `, ${item.postProperty.state}`;
          if (item.postProperty.area) subtitle += ` • ${item.postProperty.area}`;
          if (item.postProperty.price) subtitle += ` • ₹${item.postProperty.price}`;

          suggestions.push({
            text: item.postProperty.propertyName,
            type: 'buy',
            url: `/buy-properties/${item.postProperty.propertyName.toLowerCase().replace(/\s+/g, '-')}/`,
            subtitle: subtitle || 'For Sale',
            price: item.postProperty.price
          });
        }
      });

      // Process rent suggestions with enhanced details
      rentSuggestions.forEach(item => {
        if (item.postProperty && item.postProperty.propertyName) {
          let subtitle = '';
          if (item.postProperty.city) subtitle += item.postProperty.city;
          if (item.postProperty.state && item.postProperty.city) subtitle += `, ${item.postProperty.state}`;
          if (item.postProperty.area) subtitle += ` • ${item.postProperty.area}`;
          if (item.postProperty.price) subtitle += ` • ₹${item.postProperty.price}`;

          suggestions.push({
            text: item.postProperty.propertyName,
            type: 'rent',
            url: `/rental-properties/${item.postProperty.propertyName.toLowerCase().replace(/\s+/g, '-')}/`,
            subtitle: subtitle || 'For Rent',
            price: item.postProperty.price
          });
        }
      });

      // Remove duplicates based on text
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
        index === self.findIndex(s => s.text === suggestion.text)
      );

      // Sort by relevance and limit to 12 suggestions max
      const finalSuggestions = uniqueSuggestions
        .sort((a, b) => {
          // Prioritize exact matches
          const aExact = a.text.toLowerCase().includes(query.toLowerCase());
          const bExact = b.text.toLowerCase().includes(query.toLowerCase());
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          // Then prioritize by length (shorter matches are more relevant)
          return a.text.length - b.text.length;
        })
        .slice(0, 12);

      res.status(200).json({
        suggestions: finalSuggestions,
        query: query,
        total: finalSuggestions.length
      });

    } catch (error) {
      console.error("Search suggestions error:", error);
      res.status(500).json({
        suggestions: [],
        error: "Internal server error"
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
        (item) => item.postProperty.length > 0,
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
      const postDat = await postPropertyModel.find().lean();
      // buy property
      const buyCount = (await buyCommercial_Model.find()).length;
      // rent property
      const rentCount = (await rent_Model.find()).length;
      // total project count
      const projectCount = await ProjectModel.countDocuments();
      // total leads till date
      const projectLeads = await UserModel.find().lean();
      //  leads count according to the month
      const monthlyLeads = await UserModel.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": -1,
            "_id.month": -1,
          },
        },
      ]).exec();

      const mothlyuserRegister = await postPropertyModel
        .aggregate([
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          {
            $sort: {
              "_id.year": -1,
              "_id.month": -1,
            },
          },
        ])
        .exec();

      const totalprojectLeads = projectLeads.length;

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
      }
      // Count ProjectData

      // const torent = (rentCount + rent) ;
      res.status(200).json({
        message: "data get successfull !",
        monthlyLeads,
        totalprojectLeads,

        totalUser: postDat.length,
        totalRentposted: rent,
        totalSellposted: sell,
        totalProject: projectCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  // ///////////////////

  // Enquiry for Other domain's
  static leadSumbit = async (req, res) => {
    try {
      const { name, email, number, projectName, projectAddress } = req.body;
      if (!number) {
        return res
          .status(400)
          .json({ error: "Input field is missing or undefined" });
      }

      // Respond to client first
      res.status(200).json({ message: "data received. " });

      // Save the lead data and send email concurrently
      const leadData = new LeadModel({
        name,
        email,
        number,
        projectName,
        projectAddress,
      });

      const emailPromise = tarnsporter.sendMail({
        from: "amit100acre@gmail.com",
        to: "vinay.aadharhomes@gmail.com",
        subject: `New Lead on ${projectName}`,
        html: `
             <h1>New Lead - ${projectName}</h1>
             <p>Customer Name: ${name}</p>
             <p>Customer Number: ${number}</p>
             <p>Customer Email Id: ${email}</p>
             <p>Inquired Property Address: ${projectAddress}</p>
             <p>Please review the details and take necessary actions.</p>
             <p>Thank you!</p>
           `,
      });

      await Promise.all([leadData.save(), emailPromise]);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
}
module.exports = homeController;
