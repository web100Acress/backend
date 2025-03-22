const { isValidObjectId } = require("mongoose");
const careerModal = require("../../../models/career/careerSchema");
const cache = require("memory-cache");
const openModal = require("../../../models/career/opening");
const fs = require("fs");
const {
  uploadFile,
  deleteFile,
  updateFile,
} = require("../../../Utilities/s3HelperUtility");
// const AWS = require("aws-sdk");
require("dotenv").config();

// AWS.config.update({
//   secretAccessKey: process.env.AWS_S3_SECRET_ACESS_KEY,
//   accessKeyId: process.env.AWS_S3_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const s3 = new AWS.S3();
// const uploadFile = (file) => {
//   // Read the file content
//   // console.log("F.KAWHFIOQFJ");
//   const fileContent = fs.promises.readFileSync(file.path);

//   const params = {
//     Bucket: "100acress-media-bucket", // You can use environment variables for sensitive data like bucket name
//     Key: `uploads/${Date.now()}-${file.originalname}`, // Store the file with a unique name in the 'uploads/' folder
//     Body: fileContent,
//     ContentType: file.mimetype,
//   };

//   // Return the promise from s3.upload
//   return s3.upload(params).promise();
// };
// const update = (file, objectKey) => {
//   const fileContent = fs.promises.readFileSync(file.path);
//   if (objectKey != null) {
//     const params = {
//       Bucket: "100acress-media-bucket",
//       Key: objectKey,
//       Body: fileContent,
//       ContentType: file.mimetype,
//     };
//     return s3.upload(params).promise();
//   } else {
//     const params = {
//       Bucket: "100acress-media-bucket", // You can use environment variables for sensitive data like bucket name
//       Key: `uploads/${Date.now()}-${file.originalname}`, // Store the file with a unique name in the 'uploads/' folder
//       Body: fileContent,
//       ContentType: file.mimetype,
//     };

//     // Return the promise from s3.upload
//     return s3.upload(params).promise();
//   }
// };

class CareerController {
  static careerInsert = async (req, res) => {
    console.log(req.files, "jhfuirehiu");
    try {
      const { whyAcress, driveCulture, inHouse, lifeAcress } = req.body;

      if (
        !req.files ||
        !req.files.bannerImage ||
        !req.files.activityImage ||
        !req.files.highlightImage
      ) {
        return res.status(400).json({ error: "Image required !" });
      }
      const image1 = await uploadFile(req.files.bannerImage[0]);
      let image2 = [];
      if (req.files.activityImage) {
        image2 = await Promise.all(
          req.files.activityImage.map((file) => uploadFile(file)),
        );
      }

      let image3 = [];
      if (req.files.highlightImage) {
        image3 = await Promise.all(
          req.files.highlightImage.map((file) => uploadFile(file)),
        );
      }
      const data = new careerModal({
        bannerImage: {
          public_id: image1.Key,
          url: image1.Location,
        },
        highlightImage: image3.map((image) => ({
          public_id: image.Key,
          url: image.Location,
        })),
        activityImage: image2.map((image) => ({
          public_id: image.Key,
          url: image.Location,
        })),
        whyAcress: whyAcress,
        driveCulture: driveCulture,
        inHouse: inHouse,
        lifeAcress: lifeAcress,
      });
      await data.save();
      // Remove local files after successful upload
      req.files.bannerImage.forEach((file) => fs.unlinkSync(file.path));
      req.files.activityImage.forEach((file) => fs.unlinkSync(file.path));
      req.files.highlightImage.forEach((file) => fs.unlinkSync(file.path));
      res.status(200).json({
        message: "data sent successfully !",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal",
      });
    }
  };
  static careerView = async (req, res) => {
    // console.log("hello nfuih")
    try {
      const data = await careerModal.find();

      res.status(200).json({
        message: "data get successfully ! ",
        data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  static careerEdit = async (req, res) => {
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const data = await careerModal.findById({ _id: id });
        res.status(200).json({
          message: "data get successfully !",
          data,
        });
      } else {
        res.status(200).json({
          message: "Check Id ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static careerUpdate = async (req, res) => {
    try {
      // Destructure files for easier access
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const { bannerImage, activityImage, highlightImage } = req.files;
        const { whyAcress, driveCulture, inHouse, lifeAcress } = req.body;
        const data = await careerModal.findById({ _id: id });

        const bannerObjectKey = data.bannerImage.public_id;

        const activityObjectKey = data.activityImage.map((item) => {
          return item.public_id;
        });

        const highlighObjectKey = data.highlightImage.map((item) => {
          return item.public_id;
        });
        //  res.send(highlighObjectKey)
        // Example logic for updating database dynamically
        const updateData = {}; // Initialize an empty object
        if (bannerImage) {
          const uploadedBanner = await updateFile(
            bannerImage[0],
            bannerObjectKey,
          );
          updateData.bannerImage = {
            public_id: uploadedBanner.Key,
            url: uploadedBanner.Location,
          };
        }

        if (activityImage) {
          const uploadedActivities = await Promise.all(
            activityImage.map((file, index) =>
              updateFile(file, activityObjectKey[index]),
            ),
          );
          updateData.activityImage = uploadedActivities.map((image) => ({
            public_id: image.Key,
            url: image.Location,
          }));
        }

        if (highlightImage) {
          const uploadedHighlights = await Promise.all(
            highlightImage.map((file, index) =>
              updateFile(file, highlighObjectKey[index]),
            ),
          );
          updateData.highlightImage = uploadedHighlights.map((image) => ({
            public_id: image.Key,
            url: image.Location,
          }));
        }
        if (whyAcress != null) {
          updateData.whyAcress = whyAcress;
        }
        if (driveCulture != null) {
          updateData.driveCulture = driveCulture;
        }
        if (inHouse) {
          updateData.inHouse = inHouse;
        }
        if (lifeAcress) {
          updateData.lifeAcress = lifeAcress;
        }

        // Update only the fields that are present
        await careerModal.findByIdAndUpdate(req.params.id, updateData);

        res.status(200).json({ message: "Career updated successfully!" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error!" });
    }
  };

  static careerDelete = async (req, res) => {
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const data = await careerModal.findById({ _id: id });
        const banner = data.bannerImage.public_id;
        if (banner) {
          const data = await deleteFile(banner);
          console.log(data, "data1");
        }
        const activity = data.activityImage;
        if (activity) {
          for (let i = 0; i < activity.length; i++) {
            const id = activity[i].public_id;
            if (id) {
              const data = await deleteFile(id);
              console.log(data, "data2");
            }
          }
        }
        const highlight = data.highlightImage;
        if (highlight) {
          for (let i = 0; i < highlight.length; i++) {
            const id = highlight[i].public_id;
            console.log(id, "data3");
            if (id) {
              const data = await deleteFile(id);
              console.log(data, "data3");
            }
          }
        }
        await careerModal.findByIdAndDelete({ _id: id });
        res.status(200).json({
          message: "data Deleted successfully !",
        });
      } else {
        res.status(200).json({
          message: "Invalid id ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  /////////////Openings API/////////////
  static openingInsert = async (req, res) => {
    try {
      const {
        jobLocation,
        jobTitle,
        responsibility,
        experience,
        skill,
        jobProfile,
      } = req.body;
      if (
        jobLocation &&
        jobTitle &&
        responsibility &&
        experience &&
        skill &&
        jobProfile
      ) {
        const data = new openModal({
          jobLocation: jobLocation,
          jobTitle: jobTitle,
          responsibility: responsibility,
          experience: experience,
          skill: skill,
          jobProfile: jobProfile,
        });
        // console.log(data,"lkwehdqxNZL")
        await data.save();
        res.status(200).json({
          message: "Data Sent successfully ! ",
        });
      } else {
        res.status(200).json({
          message: "Check field !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static openingView_all = async (req, res) => {
    try {
      const data = await openModal.find();

      res.status(200).json({
        message: "data get successfully !",
        data,
      });
    } catch (error) {
      console.log(error).json({
        message: "Internal server error !",
      });
    }
  };
  static openingView_id = async (req, res) => {
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const data = await openModal.findById({ _id: id });
        res.status(200).json({
          message: "data get successfully !",
          data,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static openingEdit = async (req, res) => {
    // console.log("hello")
    try {
      const id = req.params.id;
      // console.log(id)
      if (isValidObjectId(id)) {
        const data = await openModal.findById({ _id: id });
        res.status(200).json({
          message: "data get successfully !",
        });
      } else {
        res.status(400).json({
          message: "Invalid id !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static openingUpdate = async (req, res) => {
    try {
      const {
        jobLocation,
        jobTitle,
        responsibility,
        experience,
        skill,
        jobProfile,
      } = req.body;
      const id = req.params.id;
      if (isValidObjectId(id)) {
        if (
          jobLocation &&
          jobTitle &&
          responsibility &&
          experience &&
          skill &&
          jobProfile
        ) {
          const data = await openModal.findByIdAndUpdate(
            { _id: id },
            {
              jobLocation: jobLocation,
              jobTitle: jobTitle,
              responsibility: responsibility,
              experience: experience,
              skill: skill,
              jobProfile: jobProfile,
            },
          );
          await data.save();
          res.status(200).json({
            message: "Data updated successfully !",
          });
        } else {
          res.status(400).json({
            message: "data missing!",
          });
        }
      } else {
        res.status(400).json({
          message: "invalid object id pass !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  static openingDelete = async (req, res) => {
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const data = await openModal.findByIdAndDelete({ _id: id });
        res.status(200).json({
          message: "Data deleted successfully !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
}
module.exports = CareerController;
