const ProjectModel = require("../../../models/projectDetail/project");
const UserModel = require("../../../models/projectDetail/user");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv").config();
const cache = require("memory-cache");
const nodemailer = require("nodemailer");
const { isValidObjectId } = require("mongoose");
const fs = require("fs");
const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");


require("dotenv").config();
AWS.config.update({
  secretAccessKey: process.env.AWS_S3_SECRET_ACESS_KEY,
  accessKeyId: process.env.AWS_S3_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();
const sendPostEmail = async (email, number, projectName) => {
  const transporter = await nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    logger: false,
    debug: true,
    secureConnection: false,
    auth: {
      // user: process.env.Email,
      // pass: process.env.EmailPass
      user: "web.100acress@gmail.com",
      pass: "txww gexw wwpy vvda",
    },
    tls: {
      rejectUnAuthorized: true,
    },
  });
  // Send mail with defined transport objec
  let info = await transporter.sendMail({
    from: "amit100acre@gmail.com", // Sender address
    to: "query.aadharhomes@gmail.com", // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
    subject: "Project Enquiry",
    html: `
        <!DOCTYPE html>
        <html lang:"en>
        <head>
        <meta charset:"UTF-8">
        <meta http-equiv="X-UA-Compatible"  content="IE=edge">
        <meta name="viewport"  content="width=device-width, initial-scale=1.0">
        <title>New Project Submission</title>
        </head>
        <body>
            <h1>New Lead</h1>
            <h3>A new Enquiry</h3>
            <p>Customer Email Id : ${email}</p>
            <p>Customer Mobile Number : ${number} </p>
            <p>ProjectName : ${projectName}</p>
            <p>Please review the details and take necessary actions.</p>
            <p>Thank you!</p>
        </body>
        </html>
`,
  });
};

const fetchDataFromDatabase = async () => {
  try {
    const limit = 50; // Split into more chunks
    const dataPromises = [];
    for (let i = 0; i < 6; i++) {
      dataPromises.push(
        ProjectModel.find()
          .skip(i * limit)
          .limit(limit)
          .lean()
      );
    }
    const dataArrays = await Promise.all(dataPromises);
    const data = [].concat(...dataArrays);
    return data;
  } catch (error) {
    throw error;
  }
};

const upload = (file) => {
  const fileContent = fs.readFileSync(file.path);

  const params = {
    Bucket: "100acress-media-bucket",
    Body: fileContent,
    Key: `uploads/${Date.now()}-${file.originalname}`,
    ContentType: file.mimetype,
  };
  return s3.upload(params).promise();
};

const uploadUpdate = (file, objectKey) => {
  const fileContent = fs.readFileSync(file.path);
  if (objectKey != null) {
    const params = {
      Bucket: "100acress-media-bucket",
      Key: objectKey,
      Body: fileContent,
      ContentType: file.mimetype,
    };
    return s3.upload(params).promise();
  } else {
    const params = {
      Bucket: "100acress-media-bucket", // You can use environment variables for sensitive data like bucket name
      Key: `uploads/${Date.now()}-${file.originalname}`, // Store the file with a unique name in the 'uploads/' folder
      Body: fileContent,
      ContentType: file.mimetype,
    };

    // Return the promise from s3.upload
    return s3.upload(params).promise();
  }
};

const deleteFile = async (fileKey) => {
  const params = {
    Bucket: "100acress-media-bucket",
    Key: fileKey,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`File deleted successfully: ${fileKey}`);
    return true;
  } catch (error) {
    console.error(`Error deleting file: ${fileKey}`, error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};

class projectController {
  // Project data insert api
    
  static projectInsert = async (req, res) => {
    console.log("Headers: ",req.headers);
    console.log("Body: ",req.body);
    // console.log("hello")
    try {
      // console.log(req.body)
      const {
        projectName,
        state,
        projectAddress,
        project_discripation,
        AboutDeveloper,
        builderName,
        projectRedefine_Connectivity,
        projectRedefine_Education,
        projectRedefine_Business,
        projectRedefine_Entertainment,
        Amenities,
        meta_title,
        meta_description,
        projectBgContent,
        projectReraNo,
        type,
        city,
        projectOverview,
        project_url,
        project_Status,
        towerNumber,
        totalUnit,
        totalLandArea,
        launchingDate,
        mobileNumber,
        possessionDate,
        minPrice,
        maxPrice,
      } = req.body;
      const {
        logo,
        frontImage,
        project_locationImage,
        project_floorplan_Image,
        highlightImage,
        project_Brochure,
        projectGallery,
        projectMaster_plan,
      } = req.files;

      if (
        !projectName &&
        !state &&
        !projectAddress &&
        !project_discripation &&
        !AboutDeveloper &&
        !builderName &&
        !projectRedefine_Connectivity &&
        !projectRedefine_Education &&
        !projectRedefine_Business &&
        !projectRedefine_Entertainment &&
        !Amenities &&
        !meta_title &&
        !meta_description &&
        !projectBgContent &&
        !projectReraNo &&
        !type &&
        !city &&
        !projectOverview &&
        !project_url &&
        !project_Status &&
        !towerNumber &&
        !totalUnit &&
        !totalLandArea &&
        !launchingDate &&
        !mobileNumber &&
        !possessionDate &&
        !minPrice &&
        !maxPrice
      ) {
        return res.status(400).json({
          error: "Check Input field !",
        });
      }
      // console.log(req.files,";vjlah")
      if (
        !logo &&
        !frontImage &&
        !project_locationImage &&
        !project_floorplan_Image &&
        !highlightImage &&
        !project_Brochure &&
        !projectGallery &&
        !projectMaster_plan
      ) {
        return res.status(400).json({
          error: "Check image field !",
        });
      }
      // Prepare an array of promises for all uploads
      const uploadPromises = [
        upload(logo[0]),
        upload(frontImage[0]),
        upload(project_locationImage[0]),
        upload(highlightImage[0]),
        upload(projectMaster_plan[0]),
        upload(project_Brochure[0]),
      ];

      // Use Promise.all to upload all files concurrently
      const [
        logoResult,
        frontResult,
        projectLocationResult,
        highlightResult,
        projectMasterResult,
        project_BrochureResult,
      ] = await Promise.all(uploadPromises);

      let project_floorplanResult = await Promise.all(
        req.files.project_floorplan_Image.map((file) => upload(file))
      );

      let projectGalleryResult = await Promise.all(
        req.files.projectGallery.map((file) => upload(file))
      );
      const data = new ProjectModel({
        projectName: projectName,
        state: state,
        city: city,
        type: type,
        projectAddress: projectAddress,
        project_discripation: project_discripation,
        project_url: project_url,
        projectBgContent: projectBgContent,
        projectOverview: projectOverview,
        project_Status: project_Status,
        projectReraNo: projectReraNo,
        AboutDeveloper: AboutDeveloper,
        builderName: builderName,
        projectRedefine_Business: projectRedefine_Business,
        projectRedefine_Connectivity: projectRedefine_Connectivity,
        projectRedefine_Entertainment: projectRedefine_Entertainment,
        projectRedefine_Education: projectRedefine_Education,
        Amenities: Amenities,
        possessionDate: possessionDate,
        launchingDate: launchingDate,
        mobileNumber: mobileNumber,
        totalLandArea: totalLandArea,
        totalUnit: totalUnit,
        towerNumber: towerNumber,
        maxPrice: maxPrice,
        minPrice: minPrice,
        meta_title: meta_title,
        meta_description: meta_description,
        logo: {
          public_id: logoResult.Key,
          url: logoResult.Location,
        },
        frontImage: {
          public_id: frontResult.Key,
          url: frontResult.Location,
        },
        project_locationImage: {
          public_id: projectLocationResult.Key,
          url: projectLocationResult.Location,
        },
        highlightImage: {
          public_id: highlightResult.Key,
          url: highlightResult.Location,
        },
        projectMaster_plan: {
          public_id: projectMasterResult.Key,
          url: projectMasterResult.Location,
        },
        project_Brochure: {
          public_id: project_BrochureResult.Key,
          url: project_BrochureResult.Location,
        },
        project_floorplan_Image: project_floorplanResult.map((item) => ({
          public_id: item.Key,
          url: item.Location,
        })),
        projectGallery: projectGalleryResult.map((item) => ({
          public_id: item.Key,
          url: item.Location,
        })),
      });

      await data.save();
      res.status(200).json({
        message: "Submitted successfully !",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  // project data edit
  static projectEdit = async (req, res) => {
    // console.log("project edit")
    try {
      const data = await ProjectModel.findById(req.params.id);
      res.status(200).json({
        message: "data edit is enable  ! ",
        dataedit: data,
      });
    } catch (error) {
      console.log("error");
      res.status(500).json({
        message: "internal server error !",
      });
    }
  };
  // see project by name view details
  static projectView = async (req, res) => {
    // console.log("hello")
    try {
      const project_url = req.params.project_url;
      if (project_url) {
        const data = await ProjectModel.find({ project_url: project_url });
        res.status(200).json({
          message: " enable",
          dataview: data,
        });
      } else {
        res.status(200).json({
          message: "Internal server error ! ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: "an error is occured",
      });
    }
  };
  static projectUpdate = async (req, res) => {
    console.log("hello");
    try {
      const {
        logo,
        frontImage,
        project_Brochure,
        project_locationImage,
        highlightImage,
        project_floorplan_Image,
        projectGallery,
        projectMaster_plan,
      } = req.files;
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const update = {};

        const projectData = await ProjectModel.findById({ _id: id });

        if (logo) {
          const logoId = projectData.logo.public_id;
          const logoResult = await uploadUpdate(logo[0], logoId);
          update.logo = {
            public_id: logoResult.Key,
            url: logoResult.Location,
          };
        }

        if (frontImage) {
          const frontId = projectData.frontImage.public_id;
          const frontResult = await uploadUpdate(frontImage[0], frontId);
          update.frontImage = {
            public_id: frontResult.Key,
            url: frontResult.Location,
          };
        }

        if (project_locationImage) {
          const locationId = projectData.project_locationImage.public_id;
          const locationResult = await uploadUpdate(
            project_locationImage[0],
            locationId
          );
          update.project_locationImage = {
            public_id: locationResult.Key,
            url: locationResult.Location,
          };
        }

        if (highlightImage) {
          const highlightId = projectData.highlightImage.public_id;
          const highlightResult = await uploadUpdate(
            highlightImage[0],
            highlightId
          );
          update.highlightImage = {
            public_id: highlightResult.Key,
            url: highlightResult.Location,
          };
        }

        if (project_Brochure) {
          const brochureId = projectData.project_Brochure.public_id;

          const brochureResult = await uploadUpdate(
            project_Brochure[0],
            brochureId
          );
          update.project_Brochure = {
            public_id: brochureResult.Key,
            url: brochureResult.Location,
          };
        }

        if (projectMaster_plan) {
          const masterId = projectData.projectMaster_plan.public_id;

          const masterResult = await uploadUpdate(
            projectMaster_plan[0],
            masterId
          );
          update.projectMaster_plan = {
            public_id: masterResult.Key,
            url: masterResult.Location,
          };
        }
        if (project_floorplan_Image) {
          const floorId = projectData.project_floorplan_Image.map((item) => {
            return item.public_id;
          });

          let floorResult = await Promise.all(
            project_floorplan_Image.map((item, index) =>
              uploadUpdate(item, floorId[index])
            )
          );

          update.project_floorplan_Image =floorResult.map((item)=>({
            public_id:item.Key,
            url:item.Location
          }))
        }

        if (projectGallery) {
          const GalleryId = projectData.projectGallery.map((item) => {
            return item.public_id;
          });

          let galleryresult = await Promise.all(
            projectGallery.map((item, index) =>
              uploadUpdate(item, GalleryId[index])
            )
          );

          update.projectGallery =galleryresult.map((item)=>({
            public_id:item.Key,
            url:item.Location
          }))
        }
        const fieldsToUpdate = [
          "projectName",
          "state",
          "project_discripation",
          "projectAddress",
          "builderName",
          "AboutDeveloper",
          "projectRedefine_Business",
          "projectRedefine_Connectivity",
          "projectRedefine_Education",
          "projectRedefine_Entertainment",
          "Amenities",
          "projectBgContent",
          "projectReraNo",
          "meta_description",
          "meta_title",
          "type",
          "city",
          "projectOverview",
          "project_url",
          "project_Status",
          "towerNumber",
          "totalUnit",
          "totalLandArea",
          "launchingDate",
          "mobileNumber",
          "possessionDate",
          "minPrice",
          "maxPrice",
        ];

        fieldsToUpdate.forEach((field) => {
          if (req.body[field]) {
            update[field] = req.body[field];
          }
        });
   const data= await ProjectModel.findByIdAndUpdate({_id:id},update)
   await data.save()
  //  fs.unlinkSync(req.files.path);
   return res.status(200).json({
    message:"Updated successfully !"
   })
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };

  //findAll
  // static projectviewAll = async (req, res) => {
  //   try {
  //     const data = await ProjectModel.find()
  //     if (data) {
  //       res.status(200).json({
  //         message: "All project Data get  !",
  //         data,
  //       });
  //     } else {
  //       res.status(200).json({
  //         message: "data not found  !",
  //       });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     res.status(500).json({
  //       message: "internal server error ! ",
  //     });
  //   }
  // };

  static projectviewAll = async (req, res) => {

    try {
      // Check if data is available in cache
      let data = cache.get("projectData");

      // If not available in cache, fetch from the database and cache it
      if (!data) {
        data = await fetchDataFromDatabase();
        const expirationTime = 10 * 60 * 1000;
        cache.put("projectData", data, expirationTime);
      }

      if (data && data.length > 0) {
        res.status(200).json({
          message: "All project data retrieved successfully!",
          data,
        });
      } else {
        res.status(404).json({
          message: "No data found!",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error!",
      });
    }
  };

  // Route handler to get all project data
  // static projectviewAll = async (req, res) => {
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
  //  project data delete

  static projectDelete = async (req, res) => {
    // console.log("helo")
    try {
      const id = req.params.id;
      const data_id = await ProjectModel.findById({ _id: id });

      if (data_id) {
        const logoId = data_id.logo.public_id;
        if (logoId) {
          await deleteFile(logoId);
        }
        const frontId = data_id.frontImage.public_id;
        if (frontId != null) {
          await deleteFile(frontId);
        }
        const locationId = data_id.project_locationImage.public_id;
        if (locationId) {
          await deleteFile(locationId);
        }
        const floorId = data_id.project_floorplan_Image;
        for (let i = 0; i < floorId.length; i++) {
          const id = data_id.project_floorplan_Image[i].public_id;

          if (floorId) {
            await deleteFile(id);
          }
        }
        const highlightId = data_id.highlightImage.public_id;
        if (highlightId) {
          await deleteFile(highlightId);
        }
        const BrochureId = data_id.project_Brochure.public_id;
        if (BrochureId) {
          await deleteFile(BrochureId);
        }
        const GalleryId = data_id.projectGallery;
        for (let i = 0; i < GalleryId.length; i++) {
          const id = data_id.projectGallery[i].public_id;
          if (id) {
            await deleteFile(id);
          }
        }
        const masterId = data_id.projectMaster_plan.public_id;
        if (masterId) {
          await deleteFile(masterId);
        }
        const data = await ProjectModel.findByIdAndDelete({ _id: id });
        res.status(202).json({
          message: "data deleted sucessfully!",
          // deletedata: data
        });
      } else {
        res.status(200).json({
          message: "Project alredy deleted",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "internal server error !",
      });
    }
  };
  //project find trending data
  static project_trending = async (req, res) => {
    // console.log("hello")
    try {
      const data = await ProjectModel.find({
        projectOverview: "trending",
      }).limit(8);
      res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };
  // project find featured data
  static project_featured = async (req, res) => {
    // console.log("hello")
    try {
      const data = await ProjectModel.find({ projectOverview: "featured" });
      res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };
  static project_City = async (req, res) => {
    // console.log("delhi")
    try {
      const data = await ProjectModel.find({
        city: "Delhi",
        projectOverview: "delhi",
      }).limit(4);
      res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static project_Upcoming = async (req, res) => {
    // console.log("hello")
    try {
      const data = await ProjectModel.find({ projectOverview: "upcoming" });
      res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static projectAffordable = async (req, res) => {
    try {
      const affordable = "Affordable Homes";
      const data = await ProjectModel.find({ type: affordable });
      //  console.log(data)
      res.status(200).json({
        message: "data get successfully ! ",
        data,
      });
      // res.send(data)
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  ///highlight
  static highlightPoint = async (req, res) => {
    try {
      const id = req.params.id;
      const highlight_Point = req.body.highlight_Point;
      // console.log(highlight_Point,id);
      if (highlight_Point) {
        const data = {
          highlight_Point: highlight_Point,
        };
        const dataPushed = await ProjectModel.findOneAndUpdate(
          { _id: id },
          { $push: { highlight: data } },
          { new: true }
        );

        await dataPushed.save();

        res.status(200).json({
          message: "data pushed successfully !",
        });
      } else {
        res.status(200).json({
          message: "check input box",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({});
    }
  };
  static highlightPoint_view = async (req, res) => {
    try {
      //console.log("chcoSJ")
      const id = req.params.id;
      // console.log(id)
      if (id) {
        const data = await ProjectModel.findById({ _id: id });
        // console.log(data)
        if (data) {
          res.status(200).json({
            message: "data get successfully",
            data: data.highlight,
          });
        } else {
          res.status(200).json({
            message: "data not found ",
          });
        }
      } else {
        res.status(404).json({
          message: "check url id ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "internal server error !",
      });
    }
  };
  static highlightedit = async (req, res) => {
    // console.log("hello")
    try {
      const id = req.params.id;
      // console.log(id)
      if (isValidObjectId(id)) {
        const data = await ProjectModel.findOne(
          { "highlight._id": id },
          {
            highlight: {
              $elemMatch: {
                _id: id,
              },
            },
          }
        );
        res.status(200).json({
          message: "data get Successfully ! ",
          data,
        });
      } else {
        res.status(200).json({
          message: "check Your Id ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  static highlightupdate = async (req, res) => {
    // console.log("hello")
    try {
      //  console.log(req.params.id)
      const id = req.params.id;
      const highlight_Point = req.body.highlight_Point;
      if (isValidObjectId(id)) {
        const data = await ProjectModel.findOneAndUpdate(
          { "highlight._id": id },
          {
            $set: {
              "highlight.$.highlight_Point": highlight_Point,
            },
          },
          { new: true }
        );
        res.status(200).json({
          message: "data update successfully !",
          data,
        });
      } else {
        res.status(200).json({
          error: "check your field !",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };
  static highlightdelete = async (req, res) => {
    // console.log("hello")
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const data = await ProjectModel.findOne({
          "highlight._id": id,
        });
        if (!data) {
          res.status(404).json({
            error: "Post property not found",
          });
        } else {
          const index = data.highlight.findIndex(
            (highlight) => highlight._id.toString() === id
          );
          if (index === -1) {
            return res.status(404).json({ error: "Post property not found" });
          }
          data.highlight.splice(index, 1);
          await data.save();
          res
            .status(200)
            .json({ message: "Post property deleted successfully" });
        }
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };

  // project Bhk detail inter data
  static bhk_insert = async (req, res) => {
    try {
      // console.log("hello")
      if (req.body) {
        const id = req.params.id;
        if (id) {
          const { bhk_type, price, bhk_Area } = req.body;
          if (bhk_type && price && bhk_Area) {
            const data = {
              bhk_type: bhk_type,
              price: price,
              bhk_Area: bhk_Area,
            };
            const dataPushed = await ProjectModel.findOneAndUpdate(
              { _id: id },
              { $push: { BhK_Details: data } },
              { new: true }
            );

            await dataPushed.save();

            res.status(200).json({
              message: "data pushed successfully !",
            });
          } else {
            res.status(403).json({
              message: "check your input field ! ",
            });
          }
        } else {
          res.status(403).json({
            message: "check id !",
          });
        }
      } else {
        res.status(403).json({
          message: "check your field ! ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Inetrnal server error !",
      });
    }
  };
  // project bhk detail view
  static bhk_view = async (req, res) => {
    try {
      //console.log("chcoSJ")
      const id = req.params.id;
      // console.log(id)
      if (id) {
        const data = await ProjectModel.findById({ _id: id });
        // console.log(data)
        if (data) {
          res.status(200).json({
            message: "data get successfully",
            data: data.BhK_Details,
          });
        } else {
          res.status(200).json({
            message: "data not found ",
          });
        }
      } else {
        res.status(404).json({
          message: "check url id ",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  //project bhk edit data get
  static bhk_edit = async (req, res) => {
    try {
      const id = req.params.id;
      if (id) {
        const data = await ProjectModel.findOne(
          { "BhK_Details._id": id },
          {
            BhK_Details: {
              $elemMatch: {
                _id: id,
              },
            },
          }
        );

        if (data) {
          res.status(200).json({
            message: "data get successfully !",
            data,
          });
        } else {
          res.status(200).json({
            message: "data not found !",
          });
        }
      } else {
        res.status(404).json({
          message: "check your id !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  //project bhk update
  static bhk_update = async (req, res) => {
    // console.log("hello")
    try {
      const { bhk_type, price, bhk_Area } = req.body;
      const id = req.params.id;
      const update = {
        bhk_type: bhk_type,
        price: price,
        bhk_Area: bhk_Area,
      };
      if (update) {
        const data = await ProjectModel.findOneAndUpdate(
          { "BhK_Details._id": id },
          { $set: { "BhK_Details.$": update } }
        );
        if (data) {
          res.status(200).json({
            message: "data update successfully  !",
          });
        } else {
          res.status(200).json({
            message: "data not found !",
          });
        }
      } else {
        res.status(200).json({
          message: "check field !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // project bhk delete
  // static bhk_delete=async(req,res)=>{
  //     // console.log("kas")
  //     try {
  //         const id=req.params.id
  //         if(id){
  //         const update = {
  //             $pull: {
  //                 BhK_Details: { _id: id }
  //             }
  //         };
  //         console.log(update,"hiuid")
  //          if(update){
  //         const data= await ProjectModel.updateOne({},update, { new: true })
  //         res.status(200).json({
  //             message:"delete successfully  !"
  //         })
  //          }else{
  //             res.status(200).json({
  //                 message:"not found in database !"
  //             })
  //          }

  //     }else{  res.status(404).json({
  //         message:"check id  !"
  //     })}

  //     } catch (error) {
  //         console.log(error)
  //         res.status(500).json({
  //             message:"internal server error !"
  //         })
  //     }
  // }
  static bhk_delete = async (req, res) => {
    try {
      const id = req.params.id;
      if (id) {
        const update = {
          $pull: {
            BhK_Details: { _id: id },
          },
        };
        // console.log(id)
        const data = await ProjectModel.updateOne(update);
        res.status(200).json({
          message: "Delete successful!",
          data,
        });
      } else {
        res.status(400).json({
          message: "Invalid ID!",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error!",
      });
    }
  };

  //Enquiry for the project page
  static userInsert = async (req, res) => {
    // console.log("helo")
    // const data =new UserModel
    try {
      const { name, email, mobile, projectName, address } = req.body;
      const ema = email;
      // const ema=email
      if (mobile && projectName && address) {
        const data = new UserModel({
          name: name,
          email: ema,
          mobile: mobile,
          projectName: projectName,
          address: address,
        });
        // const email = data.email
        // const number = data.mobile
        // const projectName=data.projectName
        // await sendPostEmail(email,number,projectName)

        const custName = data.name;
        const number = data.mobile;
        const emaildata = data.email;
        const project = data.projectName;

        // await sendPostEmail(email,number,projectName)
        const transporter = await nodemailer.createTransport({
          service: "gmail",
          port: 465,
          secure: true,
          logger: false,
          debug: true,
          secureConnection: false,
          auth: {
            // user: process.env.Email,
            // pass: process.env.EmailPass
            user: "web.100acress@gmail.com",
            pass: "txww gexw wwpy vvda",
          },
          tls: {
            rejectUnAuthorized: true,
          },
        });
        // Send mail with defined transport objec
        let info = await transporter.sendMail({
          from: "amit100acre@gmail.com", // Sender address
          to: "query.aadharhomes@gmail.com", // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
          subject: "100acress.com Enquiry",
          html: `
                    <!DOCTYPE html>
                    <html lang:"en>
                    <head>
                    <meta charset:"UTF-8">
                    <meta http-equiv="X-UA-Compatible"  content="IE=edge">
                    <meta name="viewport"  content="width=device-width, initial-scale=1.0">
                    <title>New Enquiry</title>
                    </head>
                    <body>
                        <h3>Project Enquiry</h3>
                        <p>Customer Name : ${custName}</p>
                        <p>Customer Email Id : ${emaildata}</p>
                        <p>Customer Mobile Number : ${number} </p>
                        <p>ProjectName : ${project}</p>
                        <p>Thank you!</p>
                    </body>
                    </html>
            `,
        });

        await data.save();
        res.status(201).json({
          message:
            "User data submitted successfully , and the data has been sent via email",
          // dataInsert: data
        });
      } else {
        res.status(403).json({
          message: "not success",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // Enquiry viewAll
  // static userViewAll = async (req, res) => {
  //   // console.log("hello")
  //   try {
  //     // console.log("hellcadco")

  //     const data = await UserModel.find();
  //     if (data) {
  //       res.status(200).json({
  //         message: "data get successfully !",
  //         data: data,
  //       });
  //     } else {
  //       res.status(200).json({
  //         message: "data not found ! ",
  //       });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     res.status(500).json({
  //       message: "Internal server error ! ",
  //     });
  //   }
  // };
  // static userViewAll = async (req, res) => {
  //   try {
  //     // Check if data is in cache
  //     const cacheData = cache.get('projectEnquiry');
  //     if (cacheData) {
  //       return res.status(200).json({
  //         message: "Data retrieved successfully from cache!",
  //         data: cacheData,
  //       });
  //     }
  //     // If data is not in cache, fetch from database
  //     const data = await UserModel.find();
  //     const expirationTime = 5 * 60 * 1000;
  //     cache.put('projectEnquiry', data, expirationTime);
  //     res.status(200).json({
  //       message: "Data retrieved successfully from database!",
  //       data: data,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({
  //       message: "Internal server error!",
  //     });
  //   }
  // };
  // Enquiry user detail view
  static userViewDetail = async (req, res) => {
    // console.log("hello")
    try {
      // console.log("hello")
      const id = req.params.id;
      if (id) {
        const data = await UserModel.findById({ _id: id });
        if (data) {
          res.status(200).json({
            message: "Data get successfully ! ",
            data: data,
          });
        } else {
          res.status(200).json({
            message: "data not found ! ",
          });
        }
      } else {
      }
    } catch (error) {}
  };
  // Enquiry update
  static userUpdate = async (req, res) => {
    //
    try {
      // console.log("hello")
      // console.log(req.body)
      const id = req.params.id;
      const { name, email, mobile, projectName, address, status } = req.body;

      if (id) {
        if (status) {
          const data = await UserModel.findByIdAndUpdate(
            { _id: id },
            {
              name: name,
              email: email,
              mobile: mobile,
              projectName: projectName,
              address: address,
              status: status,
            }
          );
          // console.log(data)
          await data.save();
        } else {
          // console.log("hello ")
          res.status(403).json({
            message: "Check status field ! ",
          });
        }
      } else {
        res.status(403).json({
          message: "please mtach id  ! ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // user data
  static userdataDelete = async (req, res) => {
    // console.log('hello delete')

    try {
      const id = req.params.id;
      const data = await UserModel.findByIdAndDelete({ _id: id });

      res.status(201).json({
        message: "message delete",
        datadelete: data,
      });
    } catch (error) {
      console.log(error);
    }
  };
  static floorImage = async (req, res) => {
    try {
      const id = req.params.id;
      const indexNumber = req.params.indexNumber;
      console.log(id, indexNumber, "snkkwhvs");

      if (isValidObjectId) {
        const data = await ProjectModel.findById({ _id: id });
        const floorplan = data.project_floorplan_Image;
        const Imagelength = floorplan.length;
        // console.log(Imagelength)
        if (indexNumber < Imagelength) {
          const public_id = floorplan[0].public_id;
          if (public_id) {
            await deleteFile(public_id);
            floorplan.splice(indexNumber, 1);
            // Update the data in the database
            await ProjectModel.findByIdAndUpdate(
              { _id: id },
              { project_floorplan_Image: floorplan }
            );
            return res
              .status(200)
              .json({ message: "Image removed successfully", floorplan });
          }
        } else {
          res.status(200).json({
            message: "Object Index number not found !",
            indexNumber,
          });
        }
      } else {
        res.status(400).json({
          message: "object id is invalid !",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };
  // trying something new from here
  static userViewAll = async (req, res) => {
    try {
      //Get page and limit from query parameters, with default values
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 1000;
      const skip = (page - 1) * limit;

      // Create a unique cache key for each page
      const cacheKey = `projectEnquiry_page_${page}_limit_${limit}`;
      // Check if data is in cache
      const cacheData = cache.get(cacheKey);
      if (cacheData) {
        return res.status(200).json({
          message: "Data retrieved successfully from cache!",
          data: cacheData,
        });
      }

      // If data is not in cache, fetch from database
      const data = await UserModel.find().skip(skip).limit(limit);

      // Calculate cache expiration time (5 minutes in milliseconds)
      const expirationTime = 5 * 60 * 1000;
      cache.put(cacheKey, data, expirationTime);

      res.status(200).json({
        message: "Data retrieved successfully from database!",
        data: data,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error!",
      });
    }
  };
  // count project according to the city
  static projectCount_city = async (req, res) => {
    try {
      const data = await ProjectModel.aggregate([
        {
          $group: {
            _id: "$builderName",
            count: { $sum: 1 },
          },
        },
      ]);
      const data2 = await ProjectModel.aggregate([
        {
          $group: {
            _id: "$city",
            count: { $sum: 1 },
          },
        },
      ]);
      // console.log(data,data2)
      res.status(200).json({
        message: "get data",
        data,
        data2,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server log",
      });
    }
  };
}
module.exports = projectController;

// const data=await ProjectModel.findOne()
// const query = { city:"delhi" };

//     const countCanada = await ProjectModel. countDocuments(query);
//     console.log(countCanada)

//     const fieldName = "city";
//     // specify an optional query document
//     const query = {  builderName:"Adani" };

// const distinctValues = await ProjectModel.distinct(fieldName, query);
// console.log(distinctValues);
// const filter = {
//     meta_title:
//     "fwfw"};
// // increment every document matching the filter with 2 more comments
// const updateDoc = {
//   $set: {
//     meta_title: `After viewing I am ${
//       100 * Math.random()
//     }% more satisfied with life.`,
//   },
// };
// const result = await ProjectModel.updateMany(filter, updateDoc);
// console.log(`Updated ${result.modifiedCount} documents`);
 