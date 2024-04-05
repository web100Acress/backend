

const { isValidObjectId } = require("mongoose");
const careerModal = require("../../../models/career/careerSchema");
const cache = require("memory-cache");

const cloudinary = require("cloudinary").v2;

class CareerController {

    static careerInsert = async (req, res) => {
        try {
            const { whyAcress, driveCulture, inHouse, lifeAcress } = req.body
            if (req.files) {
                if (req.files.highlightImage && req.files.activityImage && req.files.bannerImage) {
                    const bannerImage = req.files.bannerImage
                    const bannerResult = await cloudinary.uploader.upload(
                        bannerImage.tempFilePath, {
                        folder: "100acre/Career"
                    }
                    )
                    const highlightImage = req.files.highlightImage
                    const highlight = []
                    if (highlightImage.length >= 2) {
                        for (let i = 0; i < highlightImage.length; i++) {
                            const highlightResult = await cloudinary.uploader.upload(
                                highlightImage[i].tempFilePath, {
                                folder: '100acre/Career'
                            }
                            )
                            highlight.push({
                                public_id: highlightResult.public_id,
                                url: highlightResult.secure_url
                            })
                        }
                    } else {
                        const highlightResult = await cloudinary.uploader.upload(
                            highlightImage.tempFilePath,
                            {
                                folder: "100acre/Career"
                            })
                        highlight.push({
                            public_id: highlightResult.public_id,
                            url: highlightResult.secure_url
                        })
                    }

                    const activityImage = req.files.activityImage
                    const activity = []
                    if (activityImage.length >= 2) {
                        for (let i = 0; i < activityImage.length; i++) {
                            const activityResult = await cloudinary.uploader.upload(
                                activityImage[i].tempFilePath, {
                                folder: "100acre/Career"
                            }
                            )
                            activity.push({
                                public_id: activityResult.public_id,
                                url: activityResult.secure_url
                            })
                        }
                    } else {
                        const activityResult = await cloudinary.uploader.upload(
                            activityImage.tempFilePath, {
                            folder: "100acre/Career"
                        }
                        )
                        activity.push({
                            public_id: activityResult.public_id,
                            url: activityResult.secure_url
                        })
                    }
                    const data = new careerModal({
                        bannerImage: {
                            public_id: bannerResult.public_id,
                            url: bannerResult.url
                        },
                        highlightImage: highlight,
                        activityImage: activity,
                        whyAcress: whyAcress,
                        driveCulture: driveCulture,
                        inHouse: inHouse,
                        lifeAcress: lifeAcress
                    })
                    await data.save()
                    res.status(200).json({
                        message: "data sent successfully ! "
                    })
                } else {
                    res.status(200).json({
                        mesaage: "check Image field !"
                    })
                }
            } else {
                res.status(200).json({
                    message: "check files ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal"
            })
        }

    }
    static careerView = async(req, res) => {
        // console.log("hello nfuih")
        try{
            let cachedata= cache.get("careerData");
            if(!cachedata){
          const data =await careerModal.find()
          const expirationTime = 5 * 60 * 1000; 
          cache.put("projectData", data,expirationTime );
            res.status(200).json({
                message:"data get successfully ! ",
                data
            })
           }
          if( cachedata && cachedata.length >0){
            res.status(200).json({
                message:"data retrived successfully ! ",
                data
            })
          } 
        }catch(error){
          console.log(error)
          res.status(500).json({
            message:"Internal server error ! "
          })
        }
    }
    static careerEdit = async(req, res) => {
      try{
        const id=req.params.id
        if(isValidObjectId(id)){
            const data= await careerModal.findById({_id:id})
            res.status(200).json({
                message:"data get successfully !",
                data
            })
        }else{
            res.status(200).json({
                message:"Check Id "
            })
        }
      }catch(error){
        console.log(error)
        res.status(500).json({
            message:"Internal server error !"
        })
      }
    }
    static careerUpdate = (req, res) => {
    //  console.log("hello")
    try{
       const {whyAcress, driveCulture, inHouse, lifeAcress}=req.body
    }catch(error){
    console.log(error)
    res.status(500).json({
        message:"Internal server error ! "
    })
    }

    }
    static careerDelete = (req, res) => {

    }
    /////////////Openings API/////////////

    static openingInsert = (req, res) => {

    }
    static openingView_all = (req, res) => {

    }
    static openingView_id = (req, res) => {

    }
    static openingEdit = (req, res) => {

    }
    static openingUpdate = (req, res) => {

    }
    static openingDelete = (req, res) => {

    }

}
module.exports = CareerController


