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
const { redisClient } = require("../../../config/redis");
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
  // search in buy and rent - NO CACHE for real-time results
  static search = async (req, res) => {
    const searchTerm = req.params.key;
    if (!searchTerm) {
      return res.status(400).json({
        message: "Please enter your query!",
      });
    }

    try {
      // Direct database query - no caching
      const searchResults = await ProjectModel.find({
        $text: { $search: searchTerm },
      })
        .limit(16)
        .lean();

      if (searchResults.length > 0) {
        return res.status(200).json({
          message: "Data found!",
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
        const combinedResults = [...new Set(regexResults.flat())].slice(0, 16); // Remove duplicates and limit results
          
        return res.status(200).json({
          message: "Data found!",
          searchdata: combinedResults,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Fast real-time keyword search with Redis caching - Projects First, Then Properties
  static fastKeywordSearch = async (req, res) => {
    try {
      const { keyword, limit = 20 } = req.query;
      
      if (!keyword || keyword.trim().length < 2) {
        return res.status(200).json({
          message: "Keyword too short!",
          results: [],
          total: 0
        });
      }

      const cacheKey = `fast_search:${keyword.toLowerCase()}:${limit}`;
      
      // Check Redis cache first
      if (redisClient.isOpen) {
        try {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
            console.log(`⚡ Fast search cache hit for: ${keyword}`);
            return res.status(200).json(JSON.parse(cachedData));
          }
        } catch (error) {
          console.log("Redis cache check failed for fast search");
        }
      }

      // Enhanced multi-field search with regex
      const searchRegex = new RegExp(keyword, 'i');
      const projectSearchQuery = {
        $or: [
          { projectName: searchRegex },
          { city: searchRegex },
          { state: searchRegex },
          { builderName: searchRegex },
          { projectAddress: searchRegex },
          { type: searchRegex },
          { projectOverview: searchRegex },
          { project_discripation: searchRegex }
        ],
        isHidden: false
      };

      // Use exclusion projection for faster response
      const projects = await ProjectModel.find(projectSearchQuery)
        .select('-projectGallery -project_floorplan_Image -projectMaster_plan -projectRedefine_connectivity -projectRedefine_education -projectRedefine_business -Amenities -BhK_Details -paymentPlan')
        .limit(parseInt(limit))
        .sort({ projectName: 1 })
        .lean();

      // Now search for properties (Buy/Rent) if we still have room in limit
      let properties = [];
      const remainingLimit = parseInt(limit) - projects.length;
      
      if (remainingLimit > 0) {
        const propertySearchQuery = {
          $or: [
            { "postProperty.projectName": searchRegex },
            { "postProperty.city": searchRegex },
            { "postProperty.state": searchRegex },
            { "postProperty.propertyAddress": searchRegex },
            { "postProperty.propertyType": searchRegex },
            { "postProperty.description": searchRegex }
          ],
          "postProperty.verify": "verified"
        };

        properties = await postPropertyModel.find(propertySearchQuery)
          .limit(remainingLimit)
          .sort({ "postProperty.projectName": 1 })
          .lean();
      }

      // Combine results: Projects first, then Properties
      const allResults = [
        ...projects.map(p => ({ ...p, resultType: 'project' })),
        ...properties.map(p => ({ ...p, resultType: 'property' }))
      ];

      const response = {
        message: `Found ${allResults.length} results matching "${keyword}" (${projects.length} projects, ${properties.length} properties)`,
        results: allResults,
        total: allResults.length,
        projects: projects.length,
        properties: properties.length,
        keyword: keyword,
        cached: false
      };

      // Cache in Redis for 5 minutes
      if (redisClient.isOpen) {
        try {
          await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
          console.log(`⚡ Fast search cached for: ${keyword} (${allResults.length} results)`);
        } catch (error) {
          console.log("Redis caching failed for fast search");
        }
      }

      return res.status(200).json(response);

    } catch (error) {
      console.error("Fast keyword search error:", error);
      return res.status(500).json({ 
        message: "Internal server error!",
        results: [],
        total: 0
      });
    }
  };

  // Fast search suggestions for autocomplete - NO CACHE for real-time
  static searchSuggestions = async (req, res) => {
    try {
      const query = req.params.query;
      if (!query || query.length < 2) {
        return res.status(200).json({ suggestions: [] });
      }

      const suggestions = [];
      const limit = 10; // Reduced limit for faster response

      // Fast project suggestions only - removed slow aggregation
      const projectSuggestions = await ProjectModel.find({
        $or: [
          { projectName: { $regex: `^${query}`, $options: "i" } }, // Startswith for better UX
          { projectAddress: { $regex: query, $options: "i" } },
          { city: { $regex: `^${query}`, $options: "i" } },
        ]
      })
      .limit(limit)
      .select('projectName projectAddress city project_url')
      .lean();

      // Format project suggestions
      projectSuggestions.forEach(item => {
        suggestions.push({
          text: item.projectName,
          type: 'project',
          url: item.project_url,
          address: item.projectAddress,
          city: item.city
        });
      });

      return res.status(200).json({ 
        suggestions: suggestions.slice(0, 8) // Limit to 8 for UI
      });

    } catch (error) {
      console.error('Search suggestions error:', error);
      return res.status(200).json({ suggestions: [] });
    }
  };
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
