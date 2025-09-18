const ProjectModel = require("../../../models/projectDetail/project");
const UserModel = require("../../../models/projectDetail/user");
const cache = require("memory-cache");
const mongoose = require("mongoose");
const { isValidObjectId } = require("mongoose");
const fs = require("fs");
const {
  uploadFile,
  deleteFile,
  updateFile,
  uploadThumbnailImage,
  sendEmail
} = require("../../../Utilities/s3HelperUtility");
const ConvertJSONtoExcel = require("../../../Utilities/ConvertJSONtoExcel");
const path = require("path");

require("dotenv").config();


const fetchDataFromDatabase = async () => {
  try {
    const limit = 50; // Split into more chunks
    const dataPromises = [];
    for (let i = 0; i < 10; i++) {
      dataPromises.push(
        ProjectModel.find()
          .skip(i * limit)
          .limit(limit)
          .lean(),
      );
    }
    const dataArrays = await Promise.all(dataPromises);
    const data = [].concat(...dataArrays);
    return data;
  } catch (error) {
    throw error;
  }
};

class projectController {
  // Project data insert api

  static projectInsert = async (req, res) => {
    console.log("=== Project Insert API Called ===");
    console.log("Headers:", req.headers);
    console.log("Body keys:", Object.keys(req.body));
    console.log("Files keys:", req.files ? Object.keys(req.files) : "No files");
    
    try {
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
        country,
        luxury,
        spotlight,
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
        paymentPlan,
        minPrice,
        maxPrice,
      } = req.body;
      
      console.log("Extracted projectName:", projectName);
      console.log("Extracted type:", type);
      
      const {
        logo,
        frontImage,
        thumbnailImage,
        project_locationImage,
        project_floorplan_Image,
        highlightImage,
        project_Brochure,
        projectGallery,
        projectMaster_plan,
      } = req.files || {};

      console.log("Files received:", {
        logo: logo ? logo.length : 0,
        frontImage: frontImage ? frontImage.length : 0,
        thumbnailImage: thumbnailImage ? thumbnailImage.length : 0,
        project_locationImage: project_locationImage ? project_locationImage.length : 0,
        project_floorplan_Image: project_floorplan_Image ? project_floorplan_Image.length : 0,
        highlightImage: highlightImage ? highlightImage.length : 0,
        project_Brochure: project_Brochure ? project_Brochure.length : 0,
        projectGallery: projectGallery ? projectGallery.length : 0,
        projectMaster_plan: projectMaster_plan ? projectMaster_plan.length : 0,
      });

      const cloudfrontUrl = "https://d16gdc5rm7f21b.cloudfront.net/";

      // Check for required fields - at least projectName should be present
      if (!projectName) {
        console.log("Error: Project name is missing");
        return res.status(400).json({
          error: "Project name is required!",
        });
      }

      console.log("Starting file uploads...");

      // Initialize upload promises array
      const uploadPromises = [];
      const uploadResults = {
        logoResult: null,
        frontResult: null,
        projectLocationResult: null,
        highlightResult: null,
        projectMasterResult: null,
        project_BrochureResult: null,
        thumbnailResult: null,
      };

      // Handle single file uploads if they exist
      if (logo && logo[0]) {
        console.log("Uploading logo...");
        uploadPromises.push(uploadFile(logo[0]).then(result => { 
          uploadResults.logoResult = result; 
          console.log("Logo uploaded successfully");
        }).catch(err => {
          console.error("Logo upload failed:", err);
        }));
      }
      if (frontImage && frontImage[0]) {
        console.log("Uploading front image...");
        uploadPromises.push(uploadFile(frontImage[0]).then(result => { 
          uploadResults.frontResult = result; 
          console.log("Front image uploaded successfully");
        }).catch(err => {
          console.error("Front image upload failed:", err);
        }));
      }
      if (project_locationImage && project_locationImage[0]) {
        console.log("Uploading project location image...");
        uploadPromises.push(uploadFile(project_locationImage[0]).then(result => { 
          uploadResults.projectLocationResult = result; 
          console.log("Project location image uploaded successfully");
        }).catch(err => {
          console.error("Project location image upload failed:", err);
        }));
      }
      if (highlightImage && highlightImage[0]) {
        console.log("Uploading highlight image...");
        uploadPromises.push(uploadFile(highlightImage[0]).then(result => { 
          uploadResults.highlightResult = result; 
          console.log("Highlight image uploaded successfully");
        }).catch(err => {
          console.error("Highlight image upload failed:", err);
        }));
      }
      if (projectMaster_plan && projectMaster_plan[0]) {
        console.log("Uploading project master plan...");
        uploadPromises.push(uploadFile(projectMaster_plan[0]).then(result => { 
          uploadResults.projectMasterResult = result; 
          console.log("Project master plan uploaded successfully");
        }).catch(err => {
          console.error("Project master plan upload failed:", err);
        }));
      }
      if (project_Brochure && project_Brochure[0]) {
        console.log("Uploading project brochure...");
        uploadPromises.push(uploadFile(project_Brochure[0]).then(result => { 
          uploadResults.project_BrochureResult = result; 
          console.log("Project brochure uploaded successfully");
        }).catch(err => {
          console.error("Project brochure upload failed:", err);
        }));
      }
      if (thumbnailImage && thumbnailImage[0]) {
        console.log("Uploading thumbnail image...");
        uploadPromises.push(uploadThumbnailImage(thumbnailImage[0]).then(result => { 
          uploadResults.thumbnailResult = result; 
          console.log("Thumbnail image uploaded successfully");
        }).catch(err => {
          console.error("Thumbnail image upload failed:", err);
        }));
      }

      // Wait for all single file uploads to complete
      console.log("Waiting for file uploads to complete...");
      await Promise.all(uploadPromises);
      console.log("All single file uploads completed");

      // Handle multiple file uploads
      let project_floorplanResult = [];
      if (project_floorplan_Image && project_floorplan_Image.length > 0) {
        console.log("Uploading floor plan images...");
        try {
          project_floorplanResult = await Promise.all(
            project_floorplan_Image.map((file) => uploadFile(file)),
          );
          console.log("Floor plan images uploaded successfully");
        } catch (err) {
          console.error("Floor plan images upload failed:", err);
        }
      }

      let projectGalleryResult = [];
      if (projectGallery && projectGallery.length > 0) {
        console.log("Uploading gallery images...");
        try {
          projectGalleryResult = await Promise.all(
            projectGallery.map((file) => uploadFile(file)),
          );
          console.log("Gallery images uploaded successfully");
        } catch (err) {
          console.error("Gallery images upload failed:", err);
        }
      }

      console.log("Preparing project data...");

      // Prepare the data object with conditional image fields
      const projectData = {
        projectName: projectName,
        state: state,
        country: country,
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
        luxury: luxury,
        spotlight: spotlight,
        possessionDate: possessionDate,
        launchingDate: launchingDate,
        mobileNumber: mobileNumber && !isNaN(parseInt(mobileNumber)) ? parseInt(mobileNumber) : undefined,
        totalLandArea: totalLandArea && !isNaN(parseInt(totalLandArea)) ? parseInt(totalLandArea) : undefined,
        totalUnit: totalUnit && !isNaN(parseInt(totalUnit)) ? parseInt(totalUnit) : undefined,
        towerNumber: towerNumber && !isNaN(parseInt(towerNumber)) ? parseInt(towerNumber) : undefined,
        paymentPlan: paymentPlan,
        maxPrice: maxPrice && !isNaN(parseInt(maxPrice)) ? parseInt(maxPrice) : undefined,
        minPrice: minPrice && !isNaN(parseInt(minPrice)) ? parseInt(minPrice) : undefined,
        meta_title: meta_title,
        meta_description: meta_description,
      };

      console.log("Project data prepared:", Object.keys(projectData));

      // Add image fields only if they exist
      if (uploadResults.logoResult) {
        projectData.logo = {
          public_id: uploadResults.logoResult.Key,
          url: uploadResults.logoResult.Location,
          cdn_url: cloudfrontUrl + uploadResults.logoResult.Key,
        };
        console.log("Logo added to project data");
      }
      if (uploadResults.thumbnailResult) {
        projectData.thumbnailImage = {
          public_id: uploadResults.thumbnailResult.Key,
          url: uploadResults.thumbnailResult.Location,
          cdn_url: cloudfrontUrl + uploadResults.thumbnailResult.Key,
        };
        console.log("Thumbnail image added to project data");
      }
      if (uploadResults.frontResult) {
        projectData.frontImage = {
          public_id: uploadResults.frontResult.Key,
          url: uploadResults.frontResult.Location,
          cdn_url: cloudfrontUrl + uploadResults.frontResult.Key,
        };
        console.log("Front image added to project data");
      }
      if (uploadResults.projectLocationResult) {
        projectData.project_locationImage = {
          public_id: uploadResults.projectLocationResult.Key,
          url: uploadResults.projectLocationResult.Location,
          cdn_url: cloudfrontUrl + uploadResults.projectLocationResult.Key,
        };
        console.log("Project location image added to project data");
      }
      if (uploadResults.highlightResult) {
        projectData.highlightImage = {
          public_id: uploadResults.highlightResult.Key,
          url: uploadResults.highlightResult.Location,
          cdn_url: cloudfrontUrl + uploadResults.highlightResult.Key,
        };
        console.log("Highlight image added to project data");
      }
      if (uploadResults.projectMasterResult) {
        projectData.projectMaster_plan = {
          public_id: uploadResults.projectMasterResult.Key,
          url: uploadResults.projectMasterResult.Location,
          cdn_url: cloudfrontUrl + uploadResults.projectMasterResult.Key,
        };
        console.log("Project master plan added to project data");
      }
      if (uploadResults.project_BrochureResult) {
        projectData.project_Brochure = {
          public_id: uploadResults.project_BrochureResult.Key,
          url: uploadResults.project_BrochureResult.Location,
          cdn_url: cloudfrontUrl + uploadResults.project_BrochureResult.Key,
        };
        console.log("Project brochure added to project data");
      }
      if (project_floorplanResult.length > 0) {
        projectData.project_floorplan_Image = project_floorplanResult.map((item) => ({
          public_id: item.Key,
          url: item.Location,
          cdn_url: cloudfrontUrl + item.Key,
        }));
        console.log("Floor plan images added to project data");
      }
      if (projectGalleryResult.length > 0) {
        projectData.projectGallery = projectGalleryResult.map((item) => ({
          public_id: item.Key,
          url: item.Location,
          cdn_url: cloudfrontUrl + item.Key,
        }));
        console.log("Gallery images added to project data");
      }

      console.log("Creating ProjectModel instance...");
      const data = new ProjectModel(projectData);
      
      console.log("Project data to save:", JSON.stringify(projectData, null, 2));
      
      console.log("Saving to database...");
      try {
      await data.save();
        console.log("Project saved successfully!");
        
        // Clear cache after successful insertion so new data appears immediately
        cache.del("projectData");
        console.log("Project cache cleared");
        
      } catch (saveError) {
        console.error("Database save error:", saveError);
        console.error("Save error message:", saveError.message);
        console.error("Save error code:", saveError.code);
        console.error("Save error name:", saveError.name);
        throw saveError;
      }
      
      return res.status(200).json({
        message: "Submitted successfully !",
      });
    } catch (error) {
      console.error("=== Project Insert Error ===");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Full error object:", error);
      return res.status(500).json({
        message: "Internal server error !",
        error: error.message,
      });
    }
  };
  // project data edit
  static projectEdit = async (req, res) => {
    // console.log("project edit")
    try {
      const data = await ProjectModel.findById(req.params.id);
      return res.status(200).json({
        message: "data edit is enable  ! ",
        dataedit: data,
      });
    } catch (error) {
      console.log("error");
      return res.status(500).json({
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
        return res.status(200).json({
          message: " enable",
          dataview: data,
        });
      } else {
        return res.status(200).json({
          message: "Internal server error ! ",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "an error is occured",
      });
    }
  };
  static projectUpdate = async (req, res) => {
    console.log("hello");
    try {
      const {
        logo,
        thumbnailImage,
        frontImage,
        project_Brochure,
        project_locationImage,
        highlightImage,
        project_floorplan_Image,
        projectGallery,
        projectMaster_plan,
      } = req.files;
      
      const cloudfrontUrl = "https://d16gdc5rm7f21b.cloudfront.net/";

      const id = req.params.id;
      if (isValidObjectId(id)) {
        const update = {};

        const projectData = await ProjectModel.findById({ _id: id });

        if (logo) {
          const existing = projectData?.logo?.public_id;
          const logoResult = existing
            ? await updateFile(logo[0], existing)
            : await uploadFile(logo[0]);
          update.logo = {
            public_id: logoResult.Key,
            url: logoResult.Location,
            cdn_url: cloudfrontUrl + logoResult.Key,
          };
        }

        if (thumbnailImage) {
          const existing = projectData?.thumbnailImage?.public_id;
          const thumbnailImageResult = existing
            ? await updateFile(thumbnailImage[0], existing)
            : await uploadThumbnailImage(thumbnailImage[0]);
          update.thumbnailImage = {
            public_id: thumbnailImageResult.Key,
            url: thumbnailImageResult.Location,
            cdn_url: cloudfrontUrl + thumbnailImageResult.Key,
          };
        }

        if (frontImage) {
          const existing = projectData?.frontImage?.public_id;
          const frontResult = existing
            ? await updateFile(frontImage[0], existing)
            : await uploadFile(frontImage[0]);
          update.frontImage = {
            public_id: frontResult.Key,
            url: frontResult.Location,
            cdn_url: cloudfrontUrl + frontResult.Key,
          };
        }

        if (project_locationImage) {
          const existing = projectData?.project_locationImage?.public_id;
          const locationResult = existing
            ? await updateFile(project_locationImage[0], existing)
            : await uploadFile(project_locationImage[0]);
          update.project_locationImage = {
            public_id: locationResult.Key,
            url: locationResult.Location,
            cdn_url: cloudfrontUrl + locationResult.Key,
          };
        }

        if (highlightImage) {
          const existing = projectData?.highlightImage?.public_id;
          const highlightResult = existing
            ? await updateFile(highlightImage[0], existing)
            : await uploadFile(highlightImage[0]);
          update.highlightImage = {
            public_id: highlightResult.Key,
            url: highlightResult.Location,
            cdn_url: cloudfrontUrl + highlightResult.Key,
          };
        }

        if (project_Brochure) {
          const existing = projectData?.project_Brochure?.public_id;
          const brochureResult = existing
            ? await updateFile(project_Brochure[0], existing)
            : await uploadFile(project_Brochure[0]);
          update.project_Brochure = {
            public_id: brochureResult.Key,
            url: brochureResult.Location,
            cdn_url: cloudfrontUrl + brochureResult.Key,
          };
        }

        if (projectMaster_plan) {
          const existing = projectData?.projectMaster_plan?.public_id;
          const masterResult = existing
            ? await updateFile(projectMaster_plan[0], existing)
            : await uploadFile(projectMaster_plan[0]);
          update.projectMaster_plan = {
            public_id: masterResult.Key,
            url: masterResult.Location,
            cdn_url: cloudfrontUrl + masterResult.Key,
          };
        }
        if (project_floorplan_Image) {
          // Append new floor plan images without touching existing ones
          const existingImages = projectData.project_floorplan_Image || [];
          const uploaded = await Promise.all(
            project_floorplan_Image.map((file) => uploadFile(file))
          );
          const newItems = uploaded.map((item) => ({
            public_id: item.Key,
            url: item.Location,
            cdn_url: cloudfrontUrl + item.Key,
          }));
          update.project_floorplan_Image = [...existingImages, ...newItems];
        }

        if (projectGallery) {
          // Append new gallery images without touching existing ones
          const existingGallery = projectData.projectGallery || [];
          const uploadedGallery = await Promise.all(
            projectGallery.map((file) => uploadFile(file))
          );
          const galleryItems = uploadedGallery.map((item) => ({
            public_id: item.Key,
            url: item.Location,
            cdn_url: cloudfrontUrl + item.Key,
          }));
          update.projectGallery = [...existingGallery, ...galleryItems];
        }
        const fieldsToUpdate = [
          "projectName",
          "country",
          "luxury",
          "spotlight",
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
          "paymentPlan",
          "minPrice",
          "maxPrice",
        ];

        fieldsToUpdate.forEach((field) => {
          if (req.body[field]) {
            update[field] = req.body[field];
          }
        });
        
        console.log("update", update);

        // Perform atomic update and return the updated document
        const updatedProject = await ProjectModel.findByIdAndUpdate(
          id,
          update,
          { new: true }
        );

        // Invalidate cached project lists so fresh data is served after update
        try { cache.del("projectData"); } catch (_) {}

        return res.status(200).json({
          message: "Updated successfully !",
          data: updatedProject,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
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
        return res.status(200).json({
          message: "All project data retrieved successfully!",
          data,
        });
      } else {
        return res.status(404).json({
          message: "No data found!",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal server error!",
      });
    }
  };

  // projectController.js
static projectSearch = async (req, res) => {
  try {
    const { 
      city,
      spotlight,
      luxury,
      featured,
      trending,
      upcoming,
      affordable,
      commercial,
      allcommercialprojects,
      budgetHomes,
      comingSoon,
      scoplots,
      minPrice, 
      maxPrice,
      residentiaProject,
      allupcomingproject,
      budgethomesgurugram,
      typescoplots,
      typeaffordable,
      builderindepedentfloor,
      deendayalplots,
      villas,
      sohnaroad,
      dwarkaexpressway,
      nprroad,
      newgurgaon,
      sohna,
      sprroad,
      golfcourseextensionroad,
      golfcourseroad,
      readytomove,
      possessiondate,
      possesionafter2026,
      alldlfproject,
      builderName,
      signatureglobal,
      projectOverview,
      projectStatus,
      nh48,
      mgroad,
      underconstruction,
      newlaunch,
      dlfsco,
      sort,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};


    // Handle boolean fields (convert string 'True' to boolean true)
    if (spotlight === "1") query.spotlight = "True";
    if (luxury === "1") query.luxury = "True";
    if (featured === "1") query.projectOverview = "featured";
    if (trending === "1") query.projectOverview = "trending";
    if (upcoming === "1") query.$or = [{projectOverview: "upcoming"}, {projectReraNo: "upcoming"}];
    if (affordable === "1") query.type = "Affordable Homes";
    if (commercial === "1") query.projectOverview = "commercial";
    if (budgetHomes === "1") query.budgetHomes = true;
    if (comingSoon === "1") query.comingSoon = true;
    if (scoplots === "1") query.type = "SCO Plots";
    if (residentiaProject === "1") query.type = "Residential Flats";
    if (allupcomingproject === "1") query.project_Status = "comingsoon";
    if (budgethomesgurugram === "1") query.$or = [{projectName:"M3M Soulitude"}, {projectName:"M3M Antalya Hills"}, {projectName:"Signature Global City 93"}, {projectName:"Signature Global City 81"}];
    
    // for builders such as : DLF Homes, Signature Global,M3M India, Experion Developers, Elan Group, BPTP LTD, Adani Realty, Smartworld, Trevoc Group, Indiabulls    
    if (builderName) query.builderName = builderName;

    if (allcommercialprojects === "1") query.type = "Commercial Property";
    if (typescoplots === "1") query.projectOverview = "sco";
    if (typeaffordable === "1") query.projectOverview = "affordable";
    if (builderindepedentfloor === "1") query.$or = [{type:"Independent Floors"},{type:"Builder Floors"}];
    if (deendayalplots ==="1") query.$and  = [{city:"Gurugram"},{$or:[{type:"Deen Dayal Plots"},{type:"Residential Plots"}]}];
    if (villas === "1") query.type = "Villas";
    if (sohnaroad === "1") query.projectAddress = {"$regex": "Sohna Road", "$options": "i" };
    if (dwarkaexpressway === "1") query.projectAddress = {"$regex": "Dwarka Expressway", "$options": "i" };
    if (nprroad === "1") query.projectAddress = {"$regex": "Northern Peripheral Road", "$options": "i" };
    if (golfcourseroad === "1") query.projectAddress = {"$regex": "Golf Course", "$options": "i" };
    if (newgurgaon === "1") query.projectAddress = {"$regex": "New Gurgaon", "$options": "i" };
    if (sohna === "1") query.projectAddress = {"$regex": "Sohna", "$options": "i" };
    if (sprroad === "1") query.projectAddress = {"$regex": "Southern Peripheral Road", "$options": "i" };
    if (golfcourseextensionroad === "1") query.projectAddress = {"$regex": "Golf Course Extn Road", "$options": "i" };
    if (city) query.city = city;
    if (readytomove === "1") query.$or = [{project_Status:"readytomove"}, {possessionDate: { $gte: new Date("2024-01-01"), $lte: new Date("2024-12-31") }}];
    //Handle Possession Date
    if (possessiondate) {
      // Convert possessionYear to a number if it's a string
      const year = parseInt(possessiondate, 10);
            
      // Check if it's a valid year
      if (!isNaN(year)) {
        // Create date range for the entire year (Jan 1 to Dec 31)
        const startOfYear = new Date(year, 0, 1);  // January 1st of the year
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);  // December 31st 23:59:59.999
        
        // Query for possession dates within that year
        query.possessionDate = { $gte: startOfYear, $lte: endOfYear };
      }
    }
    if(possesionafter2026 === "1") query.possessionDate = { $gte: new Date("2026-01-01") };
    // Handle price range if both min and max are provided
    if (minPrice && maxPrice) {
      console.log("Price filtering - minPrice:", minPrice, "maxPrice:", maxPrice);
      console.log("Price filtering - minPrice type:", typeof minPrice, "maxPrice type:", typeof maxPrice);
      
      // Convert to numbers for comparison
      const minPriceNum = parseFloat(minPrice);
      const maxPriceNum = parseFloat(maxPrice);
      
      console.log("Converted - minPriceNum:", minPriceNum, "maxPriceNum:", maxPriceNum);
      
      // SIMPLER ALTERNATIVE: Just check if minPrice is within range
      // This is more straightforward and should work for most cases
      const simplePriceFilter = {
        minPrice: { $gte: minPriceNum, $lte: maxPriceNum }
      };
      
      // Create price filter with more precise logic
      const priceFilter = {
        $or: [
          // Projects that start within the range
          { minPrice: { $gte: minPriceNum, $lte: maxPriceNum } },
          // Projects that end within the range
          { maxPrice: { $gte: minPriceNum, $lte: maxPriceNum } },
          // Projects that span the entire range
          { $and: [{ minPrice: { $lte: minPriceNum } }, { maxPrice: { $gte: maxPriceNum } }] },
          // Projects that start before range but end within range
          { $and: [{ minPrice: { $lt: minPriceNum } }, { maxPrice: { $gte: minPriceNum, $lte: maxPriceNum } }] },
          // Projects that start within range but end after range
          { $and: [{ minPrice: { $gte: minPriceNum, $lte: maxPriceNum } }, { maxPrice: { $gt: maxPriceNum } }] }
        ]
      };
      
      // Combine with existing query using $and
      if (Object.keys(query).length > 0) {
        console.log("Combining with existing query:", JSON.stringify(query, null, 2));
        query = { $and: [query, priceFilter] };
      } else {
        console.log("No existing query, using price filter only");
        query = priceFilter;
      }
      
      console.log("Final price query:", JSON.stringify(query, null, 2));
    } else if (minPrice) {
      console.log("Price filtering - minPrice only:", minPrice);
      query.minPrice = { $gte: parseFloat(minPrice) };
    } else if (maxPrice) {
      console.log("Price filtering - maxPrice only:", maxPrice);
      query.maxPrice = { $lte: parseFloat(maxPrice) };
    }
    //Handle DLF Project Unable to find the project with the parameteres for the dlf projects
    // if (dlfproject === "1") query.$or = [{projectOverview:"luxuryProject"}, {projectReraNo:"luxuryProject"}];
    
    if(alldlfproject === "1") query.builderName = "DLF Homes";
    
    // for projects such as goaProject, bptp, orris, jms, rof
    if(projectOverview) query.projectOverview = projectOverview;

    if(signatureglobal === "1") query.$and = [{builderName:"Signature Global"},{$or:[{type:"Deen Dayal Plots"},{type:"Residential Plots"}]}];

    //For builder like :emaar ,m3m, microtek
    if(projectStatus) query.project_Status = projectStatus;
    if(nh48 === "1") query.$or = [{projectAddress: {"$regex": "NH-48", "$options": "i" }},{projectAddress: {"$regex": "NH 48", "$options": "i" }}];
    if(mgroad === "1") query.$or = [{projectAddress: {"$regex": "MG Road", "$options": "i" }}];
    
    //For gurugram use city = "Gurugram" parameter
    if(underconstruction === "1") query.project_Status = "underconstruction";
    if(newlaunch === "1") query.$or = [{project_Status:"newlunch"}, {project_Status:"newlaunch"}];
    if(dlfsco === "1") query.$and = [{builderName:"DLF Homes"},{type:"SCO Plots"}];

    const cacheKey = JSON.stringify({
      query,
      page: parseInt(page),
        limit: parseInt(limit),
        sort: sort || '-createdAt'
  });

    // Check if result exists in cache
    const cachedResult = cache.get(cacheKey);
 
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    // Pagination options
    const options = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };

    const results = await ProjectModel.find(query)
      .sort(sort || '-createdAt')
      .skip(options.skip)
      .limit(options.limit).lean();

    console.log("Query executed:", JSON.stringify(query, null, 2));
    console.log("Total results found:", results.length);
    console.log("Sample results:", results.slice(0, 3).map(r => ({
      projectName: r.projectName,
      city: r.city,
      minPrice: r.minPrice,
      maxPrice: r.maxPrice
    })));

    // Debug: Check all Dubai projects
    const dubaiProjects = await ProjectModel.find({ city: "Dubai" }).lean();
    console.log("All Dubai projects:", dubaiProjects.map(p => ({
      projectName: p.projectName,
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      city: p.city
    })));

    const total = await ProjectModel.countDocuments(query);

    const response = {
      message: "Projects retrieved successfully!",
      success: true,
      total: total,
      data: results,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    };

    // Store result in cache for 5 minutes
    cache.put(cacheKey, response, 300000);

    return res.status(200).json(response);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
}

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
        const thumbnailId = data_id.thumbnailImage.public_id;
        if (thumbnailId) {
          await deleteFile(thumbnailId);
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
        return res.status(202).json({
          message: "data deleted sucessfully!",
          // deletedata: data
        });
      } else {
        return res.status(200).json({
          message: "Project alredy deleted",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "internal server error !",
      });
    }
  };
  //project find trending data
  static project_spotlight = async (req, res) => {
    // console.log("hello")
    try {
      const data = await ProjectModel.find({
        spotlight: "True",
      });
      return res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };
  static project_luxury = async (req, res) => {
    // console.log("hello")
    try {
      const data = await ProjectModel.find({
        luxury: "True",
      }).limit(8);
      return res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };
  static project_trending = async (req, res) => {
    // console.log("hello")
    try {
      const data = await ProjectModel.find({
        projectOverview: "trending",
      }).limit(8);
      return res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };
  // project find featured data
  static project_featured = async (req, res) => {
    // console.log("hello")
    try {
      const data = await ProjectModel.find({ projectOverview: "featured" });
      return res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
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
      return res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static project_Upcoming = async (req, res) => {
    // console.log("hello")
    try {
      const data = await ProjectModel.find({ projectOverview: "upcoming" });
      return res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static projectAffordable = async (req, res) => {
    try {
      const affordable = "Affordable Homes";
      const data = await ProjectModel.find({ type: affordable });
      //  console.log(data)
      return res.status(200).json({
        message: "data get successfully ! ",
        data,
      });
      // res.send(data)
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error !",
      });
    }
  };

  static project_allupcoming = async (req, res) => {
    // console.log("hello")
    try {
      const data = await ProjectModel.find({ project_Status:"comingsoon" });
      return res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static projectSCOplots = async (req, res) => {
    try {
      const SCOplots = "SCO Plots";
      const data = await ProjectModel.find({ type: SCOplots });
      //  console.log(data)
      return res.status(200).json({
        message: "data get successfully ! ",
        data,
      });
      // res.send(data)
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static project_commercial = async (req, res) => {
    try {
      const CommercialProperty = "Commercial Property";
      const data = await ProjectModel.find({ type: CommercialProperty });
      //  console.log(data)
      return res.status(200).json({
        message: "data get successfully ! ",
        data,
      });
      // res.send(data)
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static project_budgetHomes = async (req, res) => {
    try {
      const BudgetProperty = ["M3M Antalya Hills","ROF Pravasa","Signature Global City 81","M3M Soulitude"];
      const data = await ProjectModel.find({ projectName: {$in:BudgetProperty}});
      //  console.log(data)
      return res.status(200).json({
        message: "data get successfully ! ",
        data,
      });
      // res.send(data)
    } catch (error) {
      console.log(error);
      return res.status(500).json({
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
          { new: true },
        );

        await dataPushed.save();

        return res.status(200).json({
          message: "data pushed successfully !",
        });
      } else {
        return res.status(200).json({
          message: "check input box",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({});
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
          return res.status(200).json({
            message: "data get successfully",
            data: data.highlight,
          });
        } else {
          return res.status(200).json({
            message: "data not found ",
          });
        }
      } else {
        return res.status(404).json({
          message: "check url id ",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
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
          },
        );
        return res.status(200).json({
          message: "data get Successfully ! ",
          data,
        });
      } else {
        return res.status(200).json({
          message: "check Your Id ",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
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
          { new: true },
        );
        return res.status(200).json({
          message: "data update successfully !",
          data,
        });
      } else {
        return res.status(200).json({
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
          return res.status(404).json({
            error: "Post property not found",
          });
        } else {
          const index = data.highlight.findIndex(
            (highlight) => highlight._id.toString() === id,
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
      return res.status(500).json({
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
              { new: true },
            );

            await dataPushed.save();

            return res.status(200).json({
              message: "data pushed successfully !",
            });
          } else {
            return res.status(403).json({
              message: "check your input field ! ",
            });
          }
        } else {
          return res.status(403).json({
            message: "check id !",
          });
        }
      } else {
        return res.status(403).json({
          message: "check your field ! ",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
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
          return res.status(200).json({
            message: "data get successfully",
            data: data.BhK_Details,
          });
        } else {
          return res.status(200).json({
            message: "data not found ",
          });
        }
      } else {
        return res.status(404).json({
          message: "check url id ",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error !",
      });
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
          },
        );

        if (data) {
          return res.status(200).json({
            message: "data get successfully !",
            data,
          });
        } else {
          return res.status(200).json({
            message: "data not found !",
          });
        }
      } else {
        return res.status(404).json({
          message: "check your id !",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
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
          { $set: { "BhK_Details.$": update } },
        );
        if (data) {
          return res.status(200).json({
            message: "data update successfully  !",
          });
        } else {
          return res.status(200).json({
            message: "data not found !",
          });
        }
      } else {
        return res.status(200).json({
          message: "check field !",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
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
      const bhkObjectId = new mongoose.Types.ObjectId(id);

      if (id) {
        // console.log(id)
        const data = await ProjectModel.updateOne(
          { "BhK_Details._id": bhkObjectId },
          { $pull: { BhK_Details: { _id: bhkObjectId } } }
        );
        if (data.matchedCount === 0) {
          return res.status(404).json({ message: "BHK entry not found!" });
        }
        return res.status(200).json({
          message: "Delete successful!",
          data,
        });
      } else {
        return res.status(400).json({
          message: "Invalid ID!",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error!",
      });
    }
  };

  //Enquiry for the project page
  static userInsert = async (req, res) => {
    console.log("helo")
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
          emailReceived: false,
        });

        const custName = data.name;
        const number = data.mobile;
        const emaildata = data.email;
        const project = data.projectName;

        //Send mail with AWS SES
        let emailSuccess;
        try {

          let html = `<!DOCTYPE html>
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
                    </html>`
          const to = "query.aadharhomes@gmail.com";
          const cc = ["officialhundredacress@gmail.com"]; 
          const sourceEmail = "support@100acress.com";
          const subject = "100acress.com Enquiry";
          
          emailSuccess = await sendEmail(to,sourceEmail,cc,subject,html,false);

          console.log("Email sent successfully", emailSuccess);
        } catch (error) {
          console.log("Error in sending enquiry email",error);
        }

        data.emailReceived = Boolean(emailSuccess);

        await data.save();
        return res.status(201).json({
          message: emailSuccess
            ? "User data submitted successfully , and the data has been sent via email"
            : "User data submitted successfully , but the data has not been sent via email",
          emailReceived: data.emailReceived,
          // dataInsert: data
        });
      } else {
        return res.status(403).json({
          message: "not success",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };

  // Enquiry user detail view
  static userViewDetail = async (req, res) => {
    // console.log("hello")
    try {
      // console.log("hello")
      const id = req.params.id;
      if (id) {
        const data = await UserModel.findById({ _id: id });
        if (data) {
          return res.status(200).json({
            message: "Data get successfully ! ",
            data: data,
          });
        } else {
          return res.status(200).json({
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
      const { name, email, mobile, projectName, address, status, assign, emailReceived } = req.body;

      if (id) {
        if (status || assign !== undefined || emailReceived !== undefined) {
          const updateDoc = {
            ...(name !== undefined && { name }),
            ...(email !== undefined && { email }),
            ...(mobile !== undefined && { mobile }),
            ...(projectName !== undefined && { projectName }),
            ...(address !== undefined && { address }),
            ...(status !== undefined && { status }),
            ...(assign !== undefined && { assign }),
            ...(emailReceived !== undefined && { emailReceived }),
          };

          const data = await UserModel.findByIdAndUpdate(
            { _id: id },
            updateDoc,
            { new: true },
          );
          // console.log(data)
          await data.save();
          return res.status(200).json({ message: "Updated successfully!", data });
        } else {
          // console.log("hello ")
          return res.status(403).json({
            message: "No valid fields provided to update!",
          });
        }
      } else {
        return res.status(403).json({
          message: "please mtach id  ! ",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  // user data
  static userdataDelete = async (req, res) => {
    // console.log('hello delete')

    try {
      const id = req.params.id;
      const data = await UserModel.findByIdAndUpdate(
        { _id: id },
        { deletedAt: new Date() },
        { new: true },
      );

      return res.status(201).json({
        message: "message delete",
        datadelete: data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error !" });
    }
  };
  static floorImage = async (req, res) => {
    try {
      const { id, indexNumber } = req.params;
      
      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await ProjectModel.findById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const index = parseInt(indexNumber);
      if (isNaN(index) || index < 0 || index >= project.project_floorplan_Image.length) {
        return res.status(400).json({ message: "Invalid image index" });
      }

      // Get the image to delete from S3
      const imageToDelete = project.project_floorplan_Image[index];
      
      // Delete from S3 if it exists
      if (imageToDelete && imageToDelete.key) {
        try {
          await deleteFile(imageToDelete.key);
        } catch (s3Error) {
          console.error("S3 deletion error:", s3Error);
          // Continue with database update even if S3 deletion fails
        }
      }

      // Remove from array
      project.project_floorplan_Image.splice(index, 1);
      await project.save();

      // Invalidate cache to reflect deletion on listings
      try { cache.del("projectData"); } catch (_) {}

      return res.status(200).json({ 
        message: "Floor plan image deleted successfully",
        remainingImages: project.project_floorplan_Image.length
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error !" });
    }
  };

  static galleryImage = async (req, res) => {
    try {
      const { id, indexNumber } = req.params;
      
      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await ProjectModel.findById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const index = parseInt(indexNumber);
      if (isNaN(index) || index < 0 || index >= project.projectGallery.length) {
        return res.status(400).json({ message: "Invalid image index" });
      }

      // Get the image to delete from S3
      const imageToDelete = project.projectGallery[index];
      
      // Delete from S3 if it exists
      if (imageToDelete && imageToDelete.key) {
        try {
          await deleteFile(imageToDelete.key);
        } catch (s3Error) {
          console.error("S3 deletion error:", s3Error);
          // Continue with database update even if S3 deletion fails
        }
      }

      // Remove from array
      project.projectGallery.splice(index, 1);
      await project.save();

      // Invalidate cache to reflect deletion on listings
      try { cache.del("projectData"); } catch (_) {}

      return res.status(200).json({ 
        message: "Gallery image deleted successfully",
        remainingImages: project.projectGallery.length
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error !" });
    }
  };
  static userViewAll = async (req, res) => {
    try {
      //Get page and limit from query parameters, with default values
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const skip = (page - 1) * limit;

      const search = (req.query.search || '').trim();
      const includeDeleted = String(req.query.includeDeleted || '0') === '1';

      // Soft-delete filter unless explicitly included
      const filter = includeDeleted ? {} : { deletedAt: { $in: [null, undefined] } };

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
          { projectName: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await UserModel.countDocuments(filter);

      // Get paginated data
      const data = await UserModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: "Data retrieved successfully!",
        data,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal server error!",
      });
    }
  };

  static enquiryDownload = async (req, res) => {
    try {
      //Get page and limit from query parameters, with default values
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 2000;
      const skip = (page - 1) * limit;
      // Include deleted toggle
      const includeDeleted = String(req.query.includeDeleted || '0') === '1';
      const filter = includeDeleted ? {} : { deletedAt: { $in: [null, undefined] } };
      // Create a unique cache key for each page
      const cacheKey = `projectEnquiry_page_${page}_limit_${limit}_includeDeleted_${includeDeleted}`;
      console.log("CacheKey", cacheKey);
      // Check if data is in cache
      const cacheData = cache.get(cacheKey);

      if (cacheData) {
        console.log("Serving data from cache");
        const fileName = `Enquiryfile_Page_${page}_${Date.now()}.xlsx`;
        const filePath = path.join("./temp", fileName); // Save file in a temporary directory

        await ConvertJSONtoExcel(
          JSON.parse(JSON.stringify(cacheData)),
          filePath,
        );

        //TO get the file deatils
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;

        // Set headers for file download
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${fileName}`,
        );
        res.setHeader("Content-Length", fileSize);
        res.setHeader(
          "Access-Control-Expose-Headers",
          "Content-Disposition, Content-Length",
        );

        // Stream the file to the client
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Clean up the temporary file after sending
        fileStream.on("close", () => {
          fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete temporary file:", err);
          });
        });
      } else {
        // If data is not in cache, fetch from the database
        console.log("Fetching data from database");
        const data = await UserModel.find(filter).lean().skip(skip).limit(limit).sort({ createdAt: -1 });
        // Cache the fetched data for 5 minutes
        const expirationTime = 5 * 60 * 1000;
        cache.put(cacheKey, data, expirationTime);

        // Convert JSON data to Excel
        const fileName = `Enquiryfile_Page_${page}_${Date.now()}.xlsx`;
        const filePath = path.join("./temp", fileName); // Save file in a temporary directory
        await ConvertJSONtoExcel(data, filePath);

        //TO get the file deatils
        const fileSize = fs.statSync(filePath).size;

        // Set headers for file download
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${fileName}`,
        );
        res.setHeader("Content-Length", fileSize);
        res.setHeader(
          "Access-Control-Expose-Headers",
          "Content-Disposition, Content-Length",
        );

        // Stream the file to the client
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Clean up the temporary file after sending
        fileStream.on("close", () => {
          fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete temporary file:", err);
          });
        });
      }
    } catch (error) {
      console.error("Error in enquiryDownload:", error);
      return res.status(500).send("Failed to download enquiry data");
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
      return res.status(200).json({
        message: "get data",
        data,
        data2,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal server log",
      });
    }
  };

  static projectShowHomepageLazyLoading = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const data = await ProjectModel.find().skip(skip).limit(limit);
      const count = await ProjectModel.countDocuments();
    } catch (error) {
      console.log(error);
    }
  };

  // Resend email for an enquiry and mark emailReceived accordingly
  static userSendEmail = async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Missing id" });
      }
      const record = await UserModel.findById(id);
      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }

      const custName = record.name || "";
      const number = record.mobile || "";
      const emaildata = record.email || "";
      const project = record.projectName || "";

      let emailSuccess = false;
      try {
        let html = `<!DOCTYPE html>
                    <html lang:\"en>
                    <head>
                    <meta charset:\"UTF-8\">
                    <meta http-equiv=\"X-UA-Compatible\"  content=\"IE=edge\">
                    <meta name=\"viewport\"  content=\"width=device-width, initial-scale=1.0\">
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
                    </html>`;
        const to = "query.aadharhomes@gmail.com";
        const cc = ["officialhundredacress@gmail.com"]; 
        const sourceEmail = "support@100acress.com";
        const subject = "100acress.com Enquiry";
        
        emailSuccess = await sendEmail(to, sourceEmail, cc, subject, html, false);
        console.log("Resend Email result:", emailSuccess);
      } catch (err) {
        console.error("Resend email error:", err);
      }

      record.emailReceived = Boolean(emailSuccess);
      await record.save();

      return res.status(200).json({
        message: emailSuccess ? "Email sent successfully" : "Email not sent",
        emailReceived: record.emailReceived,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error!" });
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
