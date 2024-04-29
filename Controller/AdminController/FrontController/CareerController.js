const { isValidObjectId } = require("mongoose");
const careerModal = require("../../../models/career/careerSchema");
const cache = require("memory-cache");
const openModal = require("../../../models/career/opening");

const cloudinary = require("cloudinary").v2;

class CareerController {
  static careerInsert = async (req, res) => {
    try {
      const { whyAcress, driveCulture, inHouse, lifeAcress } = req.body;
      if (req.files) {
        if (
          req.files.highlightImage &&
          req.files.activityImage &&
          req.files.bannerImage
        ) {
          const bannerImage = req.files.bannerImage;
          const bannerResult = await cloudinary.uploader.upload(
            bannerImage.tempFilePath,
            {
              folder: "100acre/Career",
            }
          );
          const highlightImage = req.files.highlightImage;
          const highlight = [];
          if (highlightImage.length >= 2) {
            for (let i = 0; i < highlightImage.length; i++) {
              const highlightResult = await cloudinary.uploader.upload(
                highlightImage[i].tempFilePath,
                {
                  folder: "100acre/Career",
                }
              );
              highlight.push({
                public_id: highlightResult.public_id,
                url: highlightResult.secure_url,
              });
            }
          } else {
            const highlightResult = await cloudinary.uploader.upload(
              highlightImage.tempFilePath,
              {
                folder: "100acre/Career",
              }
            );
            
            highlight.push({
              public_id: highlightResult.public_id,
              url: highlightResult.secure_url,
            });
          }

          const activityImage = req.files.activityImage;
          const activity = [];
          if (activityImage.length >= 2) {
            for (let i = 0; i < activityImage.length; i++) {
              const activityResult = await cloudinary.uploader.upload(
                activityImage[i].tempFilePath,
                {
                  folder: "100acre/Career",
                }
              );
              activity.push({
                public_id: activityResult.public_id,
                url: activityResult.secure_url,
              });
            }
          } else {
            const activityResult = await cloudinary.uploader.upload(
              activityImage.tempFilePath,
              {
                folder: "100acre/Career",
              }
            );
            activity.push({
              public_id: activityResult.public_id,
              url: activityResult.secure_url,
            });
          }
          const data = new careerModal({
            bannerImage: {
              public_id: bannerResult.public_id,
              url: bannerResult.url,
            },
            highlightImage: highlight,
            activityImage: activity,
            whyAcress: whyAcress,
            driveCulture: driveCulture,
            inHouse: inHouse,
            lifeAcress: lifeAcress,
          });
          await data.save();
          res.status(200).json({
            message: "data sent successfully ! ",
          });
        } else {
          res.status(200).json({
            mesaage: "check Image field !",
          });
        }
      } else {
        res.status(200).json({
          message: "check files ! ",
        });
      }
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
    //  console.log("hello")
    try {
      const { whyAcress, driveCulture, inHouse, lifeAcress } = req.body;
      const id = req.params.id;
      if (isValidObjectId(id)) {
        if (req.files) {
          if (
            req.files.highlightImage &&
            req.files.activityImage &&
            req.files.bannerImage
          ) {
            console.log("he;lo");
            const bannerImage = req.files.bannerImage;
            const bannerResult = await cloudinary.uploader.upload(
              bannerImage.tempFilePath,
              {
                folder: "100acre/Career",
              }
            );
            const highlightImage = req.files.highlightImage;
            const highlight = [];
            if (highlightImage.length >= 2) {
              for (let i = 0; i < highlightImage.length; i++) {
                const highlightResult = await cloudinary.uploader.upload(
                  highlightImage[i].tempFilePath,
                  {
                    folder: "100acre/Career",
                  }
                );
                highlight.push({
                  public_id: highlightResult.public_id,
                  url: highlightResult.secure_url,
                });
              }
            } else {
              const highlightResult = await cloudinary.uploader.upload(
                highlightImage.tempFilePath,
                {
                  folder: "100acre/Career",
                }
              );
              highlight.push({
                public_id: highlightResult.public_id,
                url: highlightResult.secure_url,
              });
            }

            const activityImage = req.files.activityImage;
            const activity = [];
            if (activityImage.length >= 2) {
              for (let i = 0; i < activityImage.length; i++) {
                const activityResult = await cloudinary.uploader.upload(
                  activityImage[i].tempFilePath,
                  {
                    folder: "100acre/Career",
                  }
                );
                activity.push({
                  public_id: activityResult.public_id,
                  url: activityResult.secure_url,
                });
              }
            } else {
              const activityResult = await cloudinary.uploader.upload(
                activityImage.tempFilePath,
                {
                  folder: "100acre/Career",
                }
              );
              activity.push({
                public_id: activityResult.public_id,
                url: activityResult.secure_url,
              });
            }
            const data = await careerModal.findByIdAndUpdate(
              { _id: id },
              {
                bannerImage: {
                  public_id: bannerResult.public_id,
                  url: bannerResult.url,
                },
                highlightImage: highlight,
                activityImage: activity,
                whyAcress: whyAcress,
                driveCulture: driveCulture,
                inHouse: inHouse,
                lifeAcress: lifeAcress,
              }
            );
            await data.save();
            res.status(200).json({
              message: "data updated successfully ! ",
            });
          } else if (req.files.bannerImage) {
            console.log("he;loban");
            const bannerImage = req.files.bannerImage;
            const bannerResult = await cloudinary.uploader.upload(
              bannerImage.tempFilePath,
              {
                folder: "100acre/Career",
              }
            );
            const data = await careerModal.findByIdAndUpdate(
              { _id: id },
              {
                bannerImage: {
                  public_id: bannerResult.public_id,
                  url: bannerResult.url,
                },
                whyAcress: whyAcress,
                driveCulture: driveCulture,
                inHouse: inHouse,
                lifeAcress: lifeAcress,
              }
            );
            await data.save();
            res.status(200).json({
              message: "data updated successfully ! ",
            });
          } else if (req.files.activityImage) {
            console.log("he;loactivity");
            const activityImage = req.files.activityImage;
            const activity = [];
            if (activityImage.length >= 2) {
              for (let i = 0; i < activityImage.length; i++) {
                const activityResult = await cloudinary.uploader.upload(
                  activityImage[i].tempFilePath,
                  {
                    folder: "100acre/Career",
                  }
                );
                activity.push({
                  public_id: activityResult.public_id,
                  url: activityResult.secure_url,
                });
              }
            } else {
              const activityResult = await cloudinary.uploader.upload(
                activityImage.tempFilePath,
                {
                  folder: "100acre/Career",
                }
              );
              activity.push({
                public_id: activityResult.public_id,
                url: activityResult.secure_url,
              });
            }
            const data = await careerModal.findByIdAndUpdate(
              { _id: id },
              {
                activityImage: activity,
                whyAcress: whyAcress,
                driveCulture: driveCulture,
                inHouse: inHouse,
                lifeAcress: lifeAcress,
              }
            );
            await data.save();
            res.status(200).json({
              message: "data updated successfully ! ",
            });
          } else if (req.files.highlightImage) {
            console.log("he;lohight");
            const highlightImage = req.files.highlightImage;
            const highlight = [];
            if (highlightImage.length >= 2) {
              for (let i = 0; i < highlightImage.length; i++) {
                const highlightResult = await cloudinary.uploader.upload(
                  highlightImage[i].tempFilePath,
                  {
                    folder: "100acre/Career",
                  }
                );
                highlight.push({
                  public_id: highlightResult.public_id,
                  url: highlightResult.secure_url,
                });
              }
            } else {
              const highlightResult = await cloudinary.uploader.upload(
                highlightImage.tempFilePath,
                {
                  folder: "100acre/Career",
                }
              );
              highlight.push({
                public_id: highlightResult.public_id,
                url: highlightResult.secure_url,
              });
            }
            const data = await careerModal.findByIdAndUpdate(
              { _id: id },
              {
                highlightImage: highlight,
                whyAcress: whyAcress,
                driveCulture: driveCulture,
                inHouse: inHouse,
                lifeAcress: lifeAcress,
              }
            );
            await data.save();
            res.status(200).json({
              message: "data updated successfully ! ",
            });
          }
        } else {
          console.log("fuhfiuwhfih");
          const data = await careerModal.findByIdAndUpdate(
            { _id: id },
            {
              whyAcress: whyAcress,
              driveCulture: driveCulture,
              inHouse: inHouse,
              lifeAcress: lifeAcress,
            }
          );
          await data.save();
          res.status(200).json({
            message: "data updated successfully ! ",
          });
        }
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };

  static careerDelete = async (req, res) => {
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const data = await careerModal.findById({ _id: id });
        const banner = data.bannerImage.public_id;
        if (banner) {
          const data = await cloudinary.uploader.destroy(banner);
          console.log(data, "data1");
        }
        const activity = data.activityImage;
        if (activity) {
          for (let i = 0; i < activity.length; i++) {
            const id = activity[i].public_id;
            if (id) {
              const data = await cloudinary.uploader.destroy(id);
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
              const data = await cloudinary.uploader.destroy(id);
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
      }
      
      
     catch (error) {
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
            }
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
  static openingDelete =async (req, res) => {
    try{
      const id=req.params.id
    if(isValidObjectId(id)){
     const data=await openModal.findByIdAndDelete({_id:id})
     res.status(200).json({
         message:"Data deleted successfully !"
     })
    }
    }catch(error){
     console.log(error)
     res.status(500).json({
        message:"Internal server error !"   
     })
    }
 }
}
module.exports = CareerController;
