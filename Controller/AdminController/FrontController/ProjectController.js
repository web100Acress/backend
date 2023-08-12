const ProjectModel = require("../../../models/projectDetail/project");
const cloudinary = require('cloudinary').v2;

class projectController {


    static project = async (req, res) => {
        res.send("project")
    }
    // Project data insert api
    static projectInsert = async (req, res) => {
        console.log("hello")
        try {
        // const {
        //     projectName,
        //     minPrice, maxPrice, developerName, bedroom, address,
        //     state, block, floor, carparkSpace, nearestLandmark,
        //     propertyType, aboutProjct, facility
        // } = req.body

        // if (projectName &&
        //     minPrice && maxPrice && developerName && bedroom && address &&
        //     state && block && floor && carparkSpace && nearestLandmark &&
        //     propertyType && aboutProjct && facility && req.files) {

        
     
        const image = req.files.sliderImage;
        const imageResult = await cloudinary.uploader.upload(
            image.tempFilePath, {
            folder: "100acre/ProjectImage"
        }
        );
        const siteImage = req.files.sitePlan;
        const site = await cloudinary.uploader.upload(
            siteImage.tempFilePath, {
            folder: "100acre/ProjectImage"
        }
        );
     
        const image2 = req.files.Image2;
        const dataviewImage = await cloudinary.uploader.upload(
            image2.tempFilePath, {
            folder: "100acre/ProjectImage"
        }
        );


        const data = new ProjectModel({
            sliderImage: {
                public_id: imageResult.public_id,
                url: imageResult.secure_url
            },
            sitePlan: {
                public_id: site.public_id,
                url: site.secure_url
            },
          
            Image2: {
                public_id: dataviewImage.public_id,
                url: dataviewImage.secure_url
            },
            projectName:req.body.projectName,
            minPrice:req.body.minPrice,
            maxPrice:req.body.maxPrice,
            developerName:req.body.developerName,
            bedroom:req.body.bedroom,
            address:req.body.address,
            state:req.body.state,
            block:req.body.block,
            floor:req.body.floor,
            carparkSpace:req.body.carparkSpace,
            nearestLandmark:req.body.nearestLandmark,
            propertyType:req.body.propertyType,
            aboutProject:req.body.aboutProject,
            facility:req.body.facility,


        })

        // console.log(data)
        await data.save()
        res.status(201).json({
            message: 'sumit data successfully',
            projectdata: data

        })

        
    // }

    // else {
    //     res.status(403).json({
    //         message: "all field are required"
    //     })
    // }
     } catch (error) {
        console.log(error)
     }


    }


    // project data edit
    static projectEdit=async(req,res)=>{
     console.log("project edit")
    try {
       const data=await ProjectModel.findById(req.params.id) 
       res.status(201).json({
        message: "editing enable",
        dataedit: data
    })
    } catch (error) {
        console.log("error")
    }
    }
 // project data edit
 static projectUpdate=async(req,res)=>{
    console.log("update")
    try {
        if(req.files){
        // const slider=req.files.sliderImage;
        // const site=req.files.sitePlan;
        // const image=req.files.image2;

        const data= await ProjectModel.findById(req.params.id)
        // console.log(data)
        const sliderid=data.sliderImage.public_id;
        await cloudinary.uploader.destroy(sliderid)

        const siteid=data.sitePlan.public_id;
        await cloudinary.uploader.destroy(siteid)

        const imageid=data.image2.public_id;
        await cloudinary.uploader.destroy(imageid)
 
        const image = req.files.sliderImage;
        const imageResult = await cloudinary.uploader.upload(
            image.tempFilePath, {
            folder: "100acre/ProjectImage"
        }
        );
        const siteImage = req.files.sitePlan;
        const site = await cloudinary.uploader.upload(
            siteImage.tempFilePath, {
            folder: "100acre/ProjectImage"
        }
        );
     
        const image2 = req.files.Image2;
        const dataviewImage = await cloudinary.uploader.upload(
            image2.tempFilePath, {
            folder: "100acre/ProjectImage"
        }
        );


        const dataUpdate = await ProjectModel.findByIdAndUpdate(req.params.id,{
            sliderImage: {
                public_id: imageResult.public_id,
                url: imageResult.secure_url
            },
            sitePlan: {
                public_id: site.public_id,
                url: site.secure_url
            },
          
            Image2: {
                public_id: dataviewImage.public_id,
                url: dataviewImage.secure_url
            },
            projectName:req.body.projectName,
            minPrice:req.body.minPrice,
            maxPrice:req.body.maxPrice,
            developerName:req.body.developerName,
            bedroom:req.body.bedroom,
            address:req.body.address,
            state:req.body.state,
            block:req.body.block,
            floor:req.body.floor,
            carparkSpace:req.body.carparkSpace,
            nearestLandmark:req.body.nearestLandmark,
            propertyType:req.body.propertyType,
            aboutProject:req.body.aboutProject,
            facility:req.body.facility,


        })

        // console.log(data)
        await dataUpdate.save()
        res.status(201).json({
            message: 'sumit dataupdate successfully',
            projectdata: dataUpdate

        })
        }else{
        const data = await ProjectModel.findByIdAndUpdate(req.params.id,{
          
            projectName:req.body.projectName,
            minPrice:req.body.minPrice,
            maxPrice:req.body.maxPrice,
            developerName:req.body.developerName,
            bedroom:req.body.bedroom,
            address:req.body.address,
            state:req.body.state,
            block:req.body.block,
            floor:req.body.floor,
            carparkSpace:req.body.carparkSpace,
            nearestLandmark:req.body.nearestLandmark,
            propertyType:req.body.propertyType,
            aboutProject:req.body.aboutProject,
            facility:req.body.facility,


        })

        // console.log(data)
        await data.save()
        res.status(201).json({
            message: 'sumit data successfully',
            projectdata: data

        })
        }
    } catch (error) {
      console.log(error)  
    }
 }



}
module.exports = projectController