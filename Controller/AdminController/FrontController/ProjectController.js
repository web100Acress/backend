const ProjectModel = require("../../../models/projectDetail/project");
const UserModel = require("../../../models/projectDetail/user");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv").config();
const cache = require("memory-cache");
const nodemailer = require("nodemailer");
const { isValidObjectId } = require("mongoose");

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

// const fetchDataFromDatabase = async () => {
//   try {
//       const data = await ProjectModel.find();
//       return data;
//   } catch (error) {
//       throw error;
//   }
// };

const fetchDataFromDatabase = async () => {
  try {
    const limit = 50;  // Split into more chunks
    const dataPromises = [];
    for (let i = 0; i < 6; i++) {
      dataPromises.push(ProjectModel.find().skip(i * limit).limit(limit).lean());
    }
    const dataArrays = await Promise.all(dataPromises);
    const data = [].concat(...dataArrays);
    return data;
  } catch (error) {
    throw error;
  }
};
class projectController {
  static project = async (req, res) => {
    res.send("project");
  };
  // Project data insert api
  static projectInsert = async (req, res) => {
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
        maxPrice
      } = req.body;

      if (projectOverview) {
        if (req.files) {
          if (
            req.files.logo &&
            req.files.frontImage &&
            req.files.project_locationImage &&
            req.files.project_floorplan_Image &&
            req.files.highlightImage &&
            req.files.project_Brochure &&
            req.files.projectGallery &&
            req.files.projectMaster_plan 
          ) {
            const logo = req.files.logo;
            const logoResult = await cloudinary.uploader.upload(
              logo.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            const frontImage = req.files.frontImage;
            const projectBgResult = await cloudinary.uploader.upload(
              frontImage.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            const project_locationImage = req.files.project_locationImage;
            const projectLocationResult = await cloudinary.uploader.upload(
              project_locationImage.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            const project_floorplan = req.files.project_floorplan_Image;
            // console.log(req.files.project_floorplan_Image)
            const floorplanLink = [];
            if (project_floorplan.length >= 2) {
              for (let i = 0; i < project_floorplan.length; i++) {
                // console.log("h")
                const project_floorplanResult =
                  await cloudinary.uploader.upload(
                    project_floorplan[i].tempFilePath,
                    {
                      folder: "100acre/project",
                    }
                  );

                floorplanLink.push({
                  public_id: project_floorplanResult.public_id,
                  url: project_floorplanResult.secure_url,
                });
              }
            } else {
              const project_floorplanResult = await cloudinary.uploader.upload(
                project_floorplan.tempFilePath,
                {
                  folder: "100acre/project",
                }
              );
              floorplanLink.push({
                public_id: project_floorplanResult.public_id,
                url: project_floorplanResult.secure_url,
              });
            }
            const project_BrochureImage = req.files.project_Brochure;
            const project_BrochureResult = await cloudinary.uploader.upload(
              project_BrochureImage.tempFilePath,
              {
                folder: "100acre/project",
                resource_type: "raw", // or "raw"
              }
            );
            const highlightImageProject = req.files.highlightImage;
            const highlightImageResult = await cloudinary.uploader.upload(
              highlightImageProject.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            const projectGalleryImage = req.files.projectGallery;
            const projectGalleryLink = [];
            if (projectGalleryImage.length >= 2) {
              for (let i = 0; i < projectGalleryImage.length; i++) {
                const projectGalleryImageResult =
                  await cloudinary.uploader.upload(
                    projectGalleryImage[i].tempFilePath,
                    {
                      folder: "100acre/project",
                    }
                  );
                projectGalleryLink.push({
                  public_id: projectGalleryImageResult.public_id,
                  url: projectGalleryImageResult.secure_url,
                });
              }
            } else {
              const projectGalleryImageResult =
                await cloudinary.uploader.upload(
                  projectGalleryImage.tempFilePath,
                  {
                    folder: "100acre/project",
                  }
                );
              projectGalleryLink.push({
                public_id: projectGalleryImageResult.public_id,
                url: projectGalleryImageResult.secure_url,
              });
            }

            const projectMaster_plan = req.files.projectMaster_plan;
            const projectMaster_planResult = await cloudinary.uploader.upload(
              projectMaster_plan.tempFilePath,
              {
                folder: "100acre/project",
              }
            );

            // console.log(projectGalleryLink, "ty");
            const data = new ProjectModel({
              logo: {
                public_id: logoResult.public_id,
                url: logoResult.secure_url,
              },
              frontImage: {
                public_id: projectBgResult.public_id,
                url: projectBgResult.secure_url,
              },
              project_locationImage: {
                public_id: projectLocationResult.public_id,
                url: projectLocationResult.secure_url,
              },
              project_floorplan_Image: floorplanLink,
              project_Brochure: {
                public_id: project_BrochureResult.public_id,
                url: project_BrochureResult.secure_url,
              },
              highlightImage: {
                public_id: highlightImageResult.public_id,
                url: highlightImageResult.secure_url,
              },
              projectMaster_plan:projectMaster_planResult,
              projectGallery: projectGalleryLink,
              project_Status: project_Status,
              projectName: projectName,
              state: state,
              project_discripation: project_discripation,
              AboutDeveloper: AboutDeveloper,
              builderName: builderName,
              projectAddress: projectAddress,
              projectRedefine_Connectivity: projectRedefine_Connectivity,
              projectRedefine_Education: projectRedefine_Education,
              projectRedefine_Business: projectRedefine_Business,
              projectRedefine_Entertainment: projectRedefine_Entertainment,
              Amenities: Amenities,
              meta_title: meta_title,
              meta_description: meta_description,
              projectBgContent: projectBgContent,
              projectReraNo: projectReraNo,
              type: type,
              city: city,
              projectOverview: projectOverview,
              project_url: project_url,
              towerNumber:  towerNumber,
              totalUnit:totalUnit,
              totalLandArea:totalLandArea,
              launchingDate:launchingDate,
              mobileNumber:mobileNumber,
              possessionDate:possessionDate,
              minPrice:minPrice,
              maxPrice:maxPrice
            });
           
             await data.save()
            res.status(200).json({
              message: "data inserted successfully ! ",
            });
          } else if (
            req.files.logo &&
            req.files.frontImage &&
            req.files.project_locationImage &&
            req.files.project_floorplan_Image &&
            req.files.highlightImage &&
            req.files.projectGallery &&
            req.files.projectMaster_plan
          ) {
            const logo = req.files.logo;
            const logoResult = await cloudinary.uploader.upload(
              logo.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            const frontImage = req.files.frontImage;
            const projectBgResult = await cloudinary.uploader.upload(
              frontImage.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            const project_locationImage = req.files.project_locationImage;
            const projectLocationResult = await cloudinary.uploader.upload(
              project_locationImage.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            const project_floorplan = req.files.project_floorplan_Image;
            // console.log(req.files.project_floorplan_Image)
            const floorplanLink = [];
            if (project_floorplan.length >= 2) {
              for (let i = 0; i < project_floorplan.length; i++) {
                // console.log("h")
                const project_floorplanResult =
                  await cloudinary.uploader.upload(
                    project_floorplan[i].tempFilePath,
                    {
                      folder: "100acre/project",
                    }
                  );

                floorplanLink.push({
                  public_id: project_floorplanResult.public_id,
                  url: project_floorplanResult.secure_url,
                });
              }
            } else {
              const project_floorplanResult = await cloudinary.uploader.upload(
                project_floorplan.tempFilePath,
                {
                  folder: "100acre/project",
                }
              );
              floorplanLink.push({
                public_id: project_floorplanResult.public_id,
                url: project_floorplanResult.secure_url,
              });
            }

            const highlightImageProject = req.files.highlightImage;
            const highlightImageResult = await cloudinary.uploader.upload(
              highlightImageProject.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            const projectGalleryImage = req.files.projectGallery;
            const projectGalleryLink = [];
            if (projectGalleryImage.length >= 2) {
              for (let i = 0; i < projectGalleryImage.length; i++) {
                const projectGalleryImageResult =
                  await cloudinary.uploader.upload(
                    projectGalleryImage[i].tempFilePath,
                    {
                      folder: "100acre/project",
                    }
                  );
                projectGalleryLink.push({
                  public_id: projectGalleryImageResult.public_id,
                  url: projectGalleryImageResult.secure_url,
                });
              }
            } else {
              const projectGalleryImageResult =
                await cloudinary.uploader.upload(
                  projectGalleryImage.tempFilePath,
                  {
                    folder: "100acre/project",
                  }
                );
              projectGalleryLink.push({
                public_id: projectGalleryImageResult.public_id,
                url: projectGalleryImageResult.secure_url,
              });
            }


            const projectMaster_plan = req.files.projectMaster_plan;
            const projectMaster_planResult = await cloudinary.uploader.upload(
              projectMaster_plan.tempFilePath,
              {
                folder: "100acre/project",
              }
            );

            const data = new ProjectModel({
              logo: {
                public_id: logoResult.public_id,
                url: logoResult.secure_url,
              },
              frontImage: {
                public_id: projectBgResult.public_id,
                url: projectBgResult.secure_url,
              },
              project_locationImage: {
                public_id: projectLocationResult.public_id,
                url: projectLocationResult.secure_url,
              },
              project_floorplan_Image: floorplanLink,

              highlightImage: {
                public_id: highlightImageResult.public_id,
                url: highlightImageResult.secure_url,
              },
              projectMaster_plan:projectMaster_planResult,
              projectGallery: projectGalleryLink,
              project_Status: project_Status,
              projectName: projectName,
              state: state,
              project_discripation: project_discripation,
              AboutDeveloper: AboutDeveloper,
              builderName: builderName,
              projectAddress: projectAddress,
              projectRedefine_Connectivity: projectRedefine_Connectivity,
              projectRedefine_Education: projectRedefine_Education,
              projectRedefine_Business: projectRedefine_Business,
              projectRedefine_Entertainment: projectRedefine_Entertainment,
              Amenities: Amenities,
              meta_title: meta_title,
              meta_description: meta_description,
              projectBgContent: projectBgContent,
              projectReraNo: projectReraNo,
              type: type,
              city: city,
              projectOverview: projectOverview,
              project_url: project_url,
              towerNumber: towerNumber,
              totalUnit:totalUnit,
              totalLandArea:totalLandArea,
              launchingDate:launchingDate,
              mobileNumber:mobileNumber,
              possessionDate:possessionDate,
              minPrice:minPrice,
              maxPrice:maxPrice
            });
           
            await data.save();
            res.status(200).json({
              message: "data inserted successfully ! ",
            });
          } else {
            res.status(403).json({
              message: "check input field skh ! ",
            });
          }
        } else {
          res.status(403).json({
            message: "check input field ! ",
          });
        }
      } else {
        res.status(403).json({
          message: "projectOverview null ! ",
        });
      }
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
    try {
      // console.log("hello")
      const {
        projectName,
        state,
        project_discripation,
        projectAddress,
        builderName,
        AboutDeveloper,
        projectRedefine_Business,
        projectRedefine_Connectivity,
        projectRedefine_Education,
        projectRedefine_Entertainment,
        Amenities,
        projectBgContent,
        projectReraNo,
        meta_description,
        meta_title,
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
        maxPrice
      } = req.body;
      const id = req.params.id;
      if (req.files) {
        // console.log("hellofile")
        if (
          req.files.logo &&
          req.files.frontImage &&
          req.files.project_locationImage &&
          req.files.project_floorplan_Image &&
          req.files.projectGallery &&
          req.files.highlightImage &&
          req.files.project_Brochure &&
          req.files.projectMaster_plan
        ) {
          // console.log("hello")
          const logo = req.files.logo;
          // console.log("hello")
          const logoResult = await cloudinary.uploader.upload(
            logo.tempFilePath,
            {
              folder: "100acre/project",
            }
          );

          const frontImage = req.files.frontImage;
          const projectBgResult = await cloudinary.uploader.upload(
            frontImage.tempFilePath,
            {
              folder: "100acre/project",
            }
          );

          const project_locationImage = req.files.project_locationImage;
          const projectlocationResult = await cloudinary.uploader.upload(
            project_locationImage.tempFilePath,
            {
              folder: "100acre/project",
            }
          );

          const project_floorplan_Image = req.files.project_floorplan_Image;
          const floorplanLink = [];

          if (project_floorplan_Image.length >= 2) {
            for (let i = 0; i < project_floorplan_Image.length; i++) {
              const project_floorplanResult = await cloudinary.uploader.upload(
                project_floorplan_Image[i].tempFilePath,
                {
                  folder: "100acre/project",
                }
              );

              floorplanLink.push({
                public_id: project_floorplanResult.public_id,
                url: project_floorplanResult.secure_url,
              });
            }
          } else {
            const project_floorplanResult = await cloudinary.uploader.upload(
              project_floorplan_Image.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            floorplanLink.push({
              public_id: project_floorplanResult.public_id,
              url: project_floorplanResult.secure_url,
            });
          }
          const project_BrochureImage = req.files.project_Brochure;
          const project_BrochureResult = await cloudinary.uploader.upload(
            project_BrochureImage.tempFilePath,
            {
              folder: "100acre/project",
              resource_type: "raw", // or "raw"
            }
          );
          const highlightImageProject = req.files.highlightImage;
          const highlightImageResult = await cloudinary.uploader.upload(
            highlightImageProject.tempFilePath,
            {
              folder: "100acre/project",
            }
          );
          const projectGalleryImage = req.files.projectGallery;
          const projectGalleryLink = [];
          if (projectGalleryImage.length >= 2) {
            for (let i = 0; i < projectGalleryImage.length; i++) {
              const projectGalleryImageResult =
                await cloudinary.uploader.upload(
                  projectGalleryImage[i].tempFilePath,
                  {
                    folder: "100acre/project",
                  }
                );
              projectGalleryLink.push({
                public_id: projectGalleryImageResult.public_id,
                url: projectGalleryImageResult.secure_url,
              });
            }
          } else {
            const projectGalleryImageResult = await cloudinary.uploader.upload(
              projectGalleryImage.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            projectGalleryLink.push({
              public_id: projectGalleryImageResult.public_id,
              url: projectGalleryImageResult.secure_url,
            });
          }
          const projectMaster_plan = req.files.projectMaster_plan;
          const projectMaster_planResult = await cloudinary.uploader.upload(
            projectMaster_plan.tempFilePath,
            {
              folder: "100acre/project",
            }
          );
          const data = await ProjectModel.findByIdAndUpdate(
            { _id: id },
            {
              logo: {
                public_id: logoResult.public_id,
                url: logoResult.secure_url,
              },
              frontImage: {
                public_id: projectBgResult.public_id,
                url: projectBgResult.secure_url,
              },
              project_locationImage: {
                public_id: projectlocationResult.public_id,
                url: projectlocationResult.secure_url,
              },
              project_floorplan_Image: floorplanLink,
              project_Brochure: {
                public_id: project_BrochureResult.public_id,
                secure_url: project_BrochureResult.secure_url,
              },
              highlightImage: {
                public_id: highlightImageResult.public_id,
                secure_url: highlightImageResult.secure_url,
              },
              projectGallery: projectGalleryLink,
              projectMaster_plan: {
                public_id: projectMaster_planResult.public_id,
                secure_url: projectMaster_planResult.secure_url,
              },
              projectName: projectName,
              state: state,
              project_discripation: project_discripation,
              projectAddress: projectAddress,
              AboutDeveloper: AboutDeveloper,
              builderName: builderName,
              projectRedefine_Business: projectRedefine_Business,
              projectRedefine_Connectivity: projectRedefine_Connectivity,
              projectRedefine_Education: projectRedefine_Education,
              projectRedefine_Entertainment: projectRedefine_Entertainment,
              // Amenities: Amenities,
              projectBgContent: projectBgContent,
              projectReraNo: projectReraNo,
              meta_title: meta_title,
              meta_description: meta_description,
              type: type,
              city: city,
              projectOverview: projectOverview,
              project_url: project_url,
              project_Status:project_Status,
              towerNumber: towerNumber,
              totalUnit:totalUnit,
              totalLandArea:totalLandArea,
              launchingDate:launchingDate,
              mobileNumber:mobileNumber,
              possessionDate:possessionDate,
              minPrice:minPrice,
              maxPrice:maxPrice
            }
          );
          // console.log(data)
          await data.save();
          res.status(200).json({
            message: "data updated successfully ! ",
          });
        } else if (req.files.logo) {
          console.log("logo");
          const logo = req.files.logo;
          // console.log("hello")
          const logoResult = await cloudinary.uploader.upload(
            logo.tempFilePath,
            {
              folder: "100acre/project",
            }
          );

          const data = await ProjectModel.findByIdAndUpdate(
            { _id: id },
            {
              logo: {
                public_id: logoResult.public_id,
                url: logoResult.secure_url,
              },

              projectName: projectName,
              state: state,
              project_discripation: project_discripation,
              projectAddress: projectAddress,
              AboutDeveloper: AboutDeveloper,
              builderName: builderName,
              projectRedefine_Business: projectRedefine_Business,
              projectRedefine_Connectivity: projectRedefine_Connectivity,
              projectRedefine_Education: projectRedefine_Education,
              projectRedefine_Entertainment: projectRedefine_Entertainment,
              // Amenities: Amenities,
              projectBgContent: projectBgContent,
              projectReraNo: projectReraNo,
              meta_title: meta_title,
              meta_description: meta_description,
              projectOverview: projectOverview,
              project_url: project_url,
              project_Status:project_Status,
              towerNumber:  towerNumber,
              totalUnit:totalUnit,
              totalLandArea:totalLandArea,
              launchingDate:launchingDate,
              mobileNumber:mobileNumber,
              possessionDate:possessionDate,
              minPrice:minPrice,
              maxPrice:maxPrice
            }
          );
          // console.log(data)
          await data.save();
          res.status(200).json({
            message: "data updated successfully ! ",
          });
        } else if (req.files.frontImage) {
          console.log("helo project")
          const frontImage = req.files.frontImage;
          const projectBgResult = await cloudinary.uploader.upload(
            frontImage.tempFilePath,
            {
              folder: "100acre/project",
            }
          );
          const data = await ProjectModel.findByIdAndUpdate(
            { _id: id },
            {
              frontImage: {
                public_id: projectBgResult.public_id,
                url: projectBgResult.secure_url,
              },
              projectName: projectName,
              state: state,
              project_discripation: project_discripation,
              projectAddress: projectAddress,
              bulderName: builderName,
              AboutDeveloper: AboutDeveloper,
              projectRedefine_Business: projectRedefine_Business,
              projectRedefine_Education: projectRedefine_Education,
              projectRedefine_Connectivity: projectRedefine_Connectivity,
              projectRedefine_Entertainment: projectRedefine_Entertainment,
              // Amenities: Amenities,
              projectBgResult: projectBgResult,
              projectReraNo: projectReraNo,
              meta_description: meta_description,
              meta_title: meta_title,
              type: type,
              city: city,
              projectOverview: projectOverview,
              project_url: project_url,
              project_Status:project_Status,
              towerNumber:  towerNumber,
              totalUnit:totalUnit,
              totalLandArea:totalLandArea,
              launchingDate:launchingDate,
              mobileNumber:mobileNumber,
              possessionDate:possessionDate,
              minPrice:minPrice,
              maxPrice:maxPrice
            }
          );
          // console.log(data)
          await data.save();
          res.status(200).json({
            message: "data updated successfully !",
          });
        } else if (req.files.project_locationImage) {
          const projectLocation = req.files.project_locationImage;
          const projectLocationResult = await cloudinary.uploader.upload(
            projectLocation.tempFilePath,
            {
              folder: "100acre/project",
            }
          );
          const data = await ProjectModel.findByIdAndUpdate(
            { _id: id },
            {
              project_locationImage: {
                public_id: projectLocationResult.public_id,
                url: projectLocationResult.secure_url,
              },
              projectName: projectName,
              state: state,
              projectAddress: projectAddress,
              builderName: builderName,
              AboutDeveloper: AboutDeveloper,
              project_discripation: project_discripation,
              projectRedefine_Business: projectRedefine_Business,
              projectRedefine_Connectivity: projectRedefine_Connectivity,
              projectRedefine_Education: projectRedefine_Education,
              projectRedefine_Entertainment: projectRedefine_Entertainment,
              // Amenities: Amenities,
              projectBgContent: projectBgContent,
              projectReraNo: projectReraNo,
              meta_description: meta_description,
              meta_title: meta_title,
              city: city,
              type: type,
              projectOverview: projectOverview,
              project_url: project_url,
              project_Status:project_Status,
              towerNumber:  towerNumber,
              totalUnit:totalUnit,
              totalLandArea:totalLandArea,
              launchingDate:launchingDate,
              mobileNumber:mobileNumber,
              possessionDate:possessionDate,
              minPrice:minPrice,
              maxPrice:maxPrice
            }
          );
          //  console.log(data)
          await data.save();
          res.status(200).json({
            message: "data updated successfully ! ",
            data,
          });
        } else if (req.files.project_floorplan_Image) {
          const project_floorplan_Image = req.files.project_floorplan_Image;
          // console.log(project_floorplan_Image)
          const floorplanLink = [];
          if (project_floorplan_Image.length >= 2) {
            for (let i = 0; i < project_floorplan_Image.length; i++) {
              const project_floorplanResult = await cloudinary.uploader.upload(
                project_floorplan_Image[i].tempFilePath,
                {
                  folder: "100acre/project",
                }
              );

              floorplanLink.push({
                public_id: project_floorplanResult.public_id,
                url: project_floorplanResult.secure_url,
              });
            }
          } else {
            const project_floorplanResult = await cloudinary.uploader.upload(
              project_floorplan_Image.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            floorplanLink.push({
              public_id: project_floorplanResult.public_id,
              url: project_floorplanResult.secure_url,
            });
          }

          const data = await ProjectModel.findByIdAndUpdate(
            { _id: id },
            {
              project_floorplan_Image: floorplanLink,
              projectName: projectName,
              state: state,
              projectAddress: projectAddress,
              project_discripation: project_discripation,
              projectRedefine_Business: projectRedefine_Business,
              projectRedefine_Connectivity: projectRedefine_Connectivity,
              projectRedefine_Entertainment: projectRedefine_Entertainment,
              projectRedefine_Education: projectRedefine_Education,
              // Amenities: Amenities,
              projectBgContent: projectBgContent,
              projectReraNo: projectReraNo,
              meta_description: meta_description,
              meta_title: meta_title,
              city: city,
              type: type,
              projectOverview: projectOverview,
              project_url: project_url,
              project_Status:project_Status,
              towerNumber:  towerNumber,
              totalUnit:totalUnit,
              totalLandArea:totalLandArea,
              launchingDate:launchingDate,
              mobileNumber:mobileNumber,
              possessionDate:possessionDate,
              minPrice:minPrice,
              maxPrice:maxPrice
            }
          );
          await data.save();
          res.status(200).json({
            message: "data updated successfully ! ",
          });
        } else if (req.files.projectGallery) {
          const projectGallery = req.files.projectGallery;
          const projectGalleryArray = [];
          if (projectGallery.length >= 2) {
            for (let i = 0; i < projectGallery.length; i++) {
              const projectGalleryImageResult =
                await cloudinary.uploader.upload(
                  projectGallery[i].tempFilePath,
                  {
                    folder: "100acre/project",
                  }
                );
              projectGalleryArray.push({
                public_id: projectGalleryImageResult.public_id,
                url: projectGalleryImageResult.secure_url,
              });
            }
          } else {
            const projectGalleryImageResult = await cloudinary.uploader.upload(
              projectGallery.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
            projectGalleryArray.push({
              public_id: projectGalleryImageResult.public_id,
              url: projectGalleryImageResult.secure_url,
            });
          }
          const data = await ProjectModel.findByIdAndUpdate(
            { _id: id },
            {
              projectGallery: projectGalleryArray,
              projectName: projectName,
              state: state,
              projectAddress: projectAddress,
              project_discripation: project_discripation,
              projectRedefine_Business: projectRedefine_Business,
              projectRedefine_Connectivity: projectRedefine_Connectivity,
              projectRedefine_Entertainment: projectRedefine_Entertainment,
              projectRedefine_Education: projectRedefine_Education,
              // Amenities: Amenities,
              projectBgContent: projectBgContent,
              projectReraNo: projectReraNo,
              meta_description: meta_description,
              meta_title: meta_title,
              city: city,
              type: type,
              projectOverview: projectOverview,
              project_url: project_url,
              project_Status: project_Status,
              project_Status:project_Status,
            }
          );
          await data.save();
          res.status(200).json({
            message: "data updated successfully ! ",
          });
        } else if (req.files.highlightImage) {
          const highlightImageProject = req.files.highlightImage;
          const highlightImageResult = await cloudinary.uploader.upload(
            highlightImageProject.tempFilePath,
            {
              folder: "100acre/project",
            }
          );
          const data = await ProjectModel.findByIdAndUpdate(
            { _id: id },
            {
              highlightImage:{
                public_id:highlightImageResult.public_id,
                url:highlightImageResult.secure_url
              } ,
              projectName: projectName,
              state: state,
              projectAddress: projectAddress,
              project_discripation: project_discripation,
              projectRedefine_Business: projectRedefine_Business,
              projectRedefine_Connectivity: projectRedefine_Connectivity,
              projectRedefine_Entertainment: projectRedefine_Entertainment,
              projectRedefine_Education: projectRedefine_Education,
              // Amenities: Amenities,
              projectBgContent: projectBgContent,
              projectReraNo: projectReraNo,
              meta_description: meta_description,
              meta_title: meta_title,
              city: city,
              type: type,
              projectOverview: projectOverview,
              project_url: project_url,
              project_Status: project_Status,
              towerNumber:  towerNumber,
              totalUnit:totalUnit,
              totalLandArea:totalLandArea,
              launchingDate:launchingDate,
              mobileNumber:mobileNumber,
              possessionDate:possessionDate,
              minPrice:minPrice,
              maxPrice:maxPrice
            }
          );
          await data.save();
          res.status(200).json({
            message: "data updated successfully ! ",
          });
        } else if (req.files.project_Brochure) {
          const project_Brochure = req.files.project_Brochure;

          const project_BrochureResult = await cloudinary.uploader.upload(
            project_Brochure.tempFilePath,
            {
              folder: "100acre/project",
              resource_type: "raw", // or "raw"
            }
          );

          console.log(project_BrochureResult);
          const data = await ProjectModel.findByIdAndUpdate(
            { _id: id },
            {
              project_Brochure: project_BrochureResult,
              projectName: projectName,
              state: state,
              projectAddress: projectAddress,
              project_discripation: project_discripation,
              projectRedefine_Business: projectRedefine_Business,
              projectRedefine_Connectivity: projectRedefine_Connectivity,
              projectRedefine_Entertainment: projectRedefine_Entertainment,
              projectRedefine_Education: projectRedefine_Education,
              // Amenities: Amenities,
              projectBgContent: projectBgContent,
              projectReraNo: projectReraNo,
              meta_description: meta_description,
              meta_title: meta_title,
              city: city,
              type: type,
              projectOverview: projectOverview,
              project_url: project_url,
              project_Status: project_Status,
              towerNumber: towerNumber,
              totalUnit:totalUnit,
              totalLandArea:totalLandArea,
              launchingDate:launchingDate,
              mobileNumber:mobileNumber,
              possessionDate:possessionDate,
              minPrice:minPrice,
              maxPrice:maxPrice
            }
          );
          await data.save();
          res.status(200).json({
            message: "data updated successfully ! ",
          });
        } else if (req.files.projectMaster_plan) {
            const projectMaster_plan = req.files.projectMaster_plan;
            const projectMaster_planResult = await cloudinary.uploader.upload(
              projectMaster_plan.tempFilePath,
              {
                folder: "100acre/project",
              }
            );
          const data = await ProjectModel.findByIdAndUpdate(
            { _id: id },
            {projectMaster_plan: projectMaster_planResult,
              projectName: projectName,
              state: state,
              projectAddress: projectAddress,
              project_discripation: project_discripation,
              projectRedefine_Business: projectRedefine_Business,
              projectRedefine_Connectivity: projectRedefine_Connectivity,
              projectRedefine_Entertainment: projectRedefine_Entertainment,
              projectRedefine_Education: projectRedefine_Education,
              // Amenities: Amenities,
              projectBgContent: projectBgContent,
              projectReraNo: projectReraNo,
              meta_description: meta_description,
              meta_title: meta_title,
              city: city,
              type: type,
              projectOverview: projectOverview,
              project_url: project_url,
              project_Status:project_Status,
              towerNumber:  towerNumber,
              totalUnit:totalUnit,
              totalLandArea:totalLandArea,
              launchingDate:launchingDate,
              mobileNumber:mobileNumber,
              possessionDate:possessionDate,
              minPrice:minPrice,
              maxPrice:maxPrice
            }
          );
          await data.save();
          res.status(200).json({
            message: "data updated successfully ! ",
          });
        }
      } else {
        const data = await ProjectModel.findByIdAndUpdate(
          { _id: id },
          {
            projectName: projectName,
            state: state,
            projectAddress: projectAddress,
            project_discripation: project_discripation,
            projectRedefine_Business: projectRedefine_Business,
            projectRedefine_Connectivity: projectRedefine_Connectivity,
            projectRedefine_Entertainment: projectRedefine_Entertainment,
            projectRedefine_Education: projectRedefine_Education,
            // Amenities: Amenities,
            projectBgContent: projectBgContent,
            projectReraNo: projectReraNo,
            meta_description: meta_description,
            meta_title: meta_title,
            city: city,
            type: type,
            projectOverview: projectOverview,
            project_url: project_url,
            project_Status:project_Status,
            towerNumber: towerNumber,
            totalUnit:totalUnit,
            totalLandArea:totalLandArea,
            launchingDate:launchingDate,
            mobileNumber:mobileNumber,
            possessionDate:possessionDate,
            minPrice:minPrice,
            maxPrice:maxPrice
          }
        );
        await data.save();
        res.status(200).json({
          message: "data updated successfully ! ",
        });
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
            cache.put("projectData", data,expirationTime );
        }

        if (data && data.length > 0) {
            res.status(200).json({
                message: "All project data retrieved successfully!",
                data
            });
        } else {
            res.status(404).json({
                message: "No data found!"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error!"
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
      const id = req.params.id
      const data_id=await ProjectModel.findById({_id:id})
    
      if(data_id){
        const logoId=data_id.logo.public_id;
        if(logoId){
            await cloudinary.uploader.destroy(logoId)
        }
        const frontId = data_id.frontImage.public_id;
        if (frontId != null) {
            await cloudinary.uploader.destroy(frontId);
        }
        const locationId=data_id.project_locationImage.public_id;
        if(locationId){
            await cloudinary.uploader.destroy(locationId)
        }
        const floorId=data_id.project_floorplan_Image
      for(let i=0; i< floorId.length ; i++){
          const id=data_id.project_floorplan_Image[i].public_id;

      if(floorId){
         await cloudinary.uploader.destroy(id) 
      }
  }
  const highlightId=data_id.highlightImage.public_id;
  if(highlightId){
      await cloudinary.uploader.destroy(highlightId)
  }
  const BrochureId=data_id.project_Brochure.public_id;
      if(BrochureId){
          await cloudinary.uploader.destroy(BrochureId)
      }
      const GalleryId=data_id.projectGallery
      for(let i=0;i<GalleryId.length ; i++){
          const id=data_id.projectGallery[i].public_id;
          if(id){
              await cloudinary.uploader.destroy(id)
          }
      }
      const masterId=data_id.projectMaster_plan.public_id;
      if(masterId){
          await cloudinary.uploader.destroy(masterId)
      }
      const data = await ProjectModel.findByIdAndDelete({ _id: id })
      res.status(202).json({
          message: 'data deleted sucessfully!',
          // deletedata: data
      })
  }else{
     res.status(200).json({
      message:"Project alredy deleted"
     })
  }
  } catch (error) {
      console.log(error)
      res.status(500).json({
          message: "internal server error !"
      })
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
  static projectAffordable=async(req,res)=>{
    try{
     const affordable="Affordable Homes";
   const data=await ProjectModel.find({type:affordable})
  //  console.log(data)
  res.status(200).json({
      message:"data get successfully ! ",
      data
  })
  // res.send(data)
  }catch(error){
      console.log(error)
      res.status(500).json({
          message:"Internal server error !"
      })
    }
  }
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
      const id = req.params.id
      // console.log(id)
      if (isValidObjectId(id)) {
        const data = await ProjectModel.findOne(
          { "highlight._id": id },
          {
            highlight: {
              $elemMatch: {
                _id: id
              }
            }
          }
        )
        res.status(200).json({
          message: "data get Successfully ! ",
          data
        })
      } else {
        res.status(200).json({
          message: "check Your Id ",

        })
      }
    } catch (error) {
      console.log(error)
      res.status(500).json({
        message: "Internal server error ! "
      })
    }
  }
  static highlightupdate=async(req,res)=>{
  // console.log("hello")
  try{
    //  console.log(req.params.id)
    const id=req.params.id;
    const highlight_Point=req.body.highlight_Point
    if(isValidObjectId(id)){
      const data=await ProjectModel.findOneAndUpdate(
        {"highlight._id":id},
        {
          $set:{
      "highlight.$.highlight_Point":highlight_Point
        }},
        {new:true}
      )
      res.status(200).json({
        message:"data update successfully !",
        data
      })
    }else{
      res.status(200).json({
        error:"check your field !"
      })
    }
  }catch(error){
    console.log(error)
  }
  }
  static highlightdelete=async(req,res)=>{
    // console.log("hello")
    try{
   const id=req.params.id
   if(isValidObjectId(id)){
    const data=await ProjectModel.findOne({
      "highlight._id":id
    })
   if(!data){
    res.status(404).json({
      error: "Post property not found"
    })
   }else{
    const index=data.highlight.findIndex(
      (highlight) => highlight._id.toString() ===id
    )
    if (index === -1) {
      return res.status(404).json({ error: "Post property not found" });
    }
    data.highlight.splice(index, 1);
    await data.save();
    res.status(200).json({ message: "Post property deleted successfully" });
   }

   }
  }catch(error){
console.log(error)
res.status(500).json({
  message:"Internal server error !"
})
  }
  }


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
      const id = req.params.id
      const  indexNumber  =req.params.indexNumber
      console.log(id,indexNumber,"snkkwhvs")
     
      if (isValidObjectId) {
        const data = await ProjectModel.findById({ _id:id})
        const floorplan = data.project_floorplan_Image
        const Imagelength = floorplan.length
        // console.log(Imagelength)
        if (indexNumber < Imagelength) {
          const public_id =floorplan[0].public_id;
          if (public_id) {
            await cloudinary.uploader.destroy(public_id); 
            floorplan.splice(indexNumber, 1);
            // Update the data in the database
            await ProjectModel.findByIdAndUpdate({_id:id}, { project_floorplan_Image: floorplan });
            return res.status(200).json({ message: "Image removed successfully", floorplan });
        }
        }else{
          res.status(200).json({
            message:"Object Index number not found !",
            indexNumber
          })
        }

      } else {
    res.status(400).json({
      message:"object id is invalid !"
    })
      }
    } catch (error) {
      console.log(error)
    }
  }
    // trying something new from here
    static userViewAll = async (req, res) => {
      try {
        //Get page and limit from query parameters, with default values
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) ||1000;
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
              count: { $sum: 1 }
            }
  
          }
        ])
        const data2=await ProjectModel.aggregate([
          {
            $group:{
  
              _id:"$city",
              count:{$sum:1}
            }
          }
        ])
        // console.log(data,data2)
        res.status(200).json({
          message:"get data",
          data,
          data2
        })
      } catch (error) {
        console.error(error)
        res.status(500).json({
          message: "Internal server log"
        })
      }
    }
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
