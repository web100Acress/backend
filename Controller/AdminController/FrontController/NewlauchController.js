const newlaunchModel = require('../../../models/newlaunch/newProject');

const cloudinary = require('cloudinary').v2;
class newlaunchController {

    static newlaunch_Insert = async (req, res) => {
        try {
            const {
                projectName, minPrice, maxPrice, developerName, bedroom, address,state, block, floor, carparkSpace, nearestLandmark, propertyType, facility, unit, launch, area, aboutProject} = req.body

            if (projectName &&minPrice && maxPrice && developerName && bedroom && address &&state && block && floor && carparkSpace && nearestLandmark &&propertyType && facility && unit && launch && area && aboutProject) {
                if (req.files.sliderImage && req.files.sitePlan && req.files.Image2) {

                    const image = req.files.sliderImage;
                    const imageResult = await cloudinary.uploader.upload(
                        image.tempFilePath, {
                        folder: "100acre/NewLaunch"
                    }
                    );
                    const siteImage = req.files.sitePlan;
                    const site = await cloudinary.uploader.upload(
                        siteImage.tempFilePath, {
                        folder: "100acre/NewLaunch"
                    }
                    );

                    const image2 = req.files.Image2;
                    const dataviewImage = await cloudinary.uploader.upload(
                        image2.tempFilePath, {
                        folder: "100acre/NewLaunch"
                    }
                    );


                    const data = new newlaunchModel({
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
                        projectName: projectName,
                        minPrice: minPrice,
                        maxPrice: maxPrice,
                        developerName: developerName,
                        bedroom: bedroom,
                        address: address,
                        state: state,
                        block: block,
                        floor: floor,
                        carparkSpace: carparkSpace,
                        nearestLandmark: nearestLandmark,
                        propertyType: propertyType,
                        aboutProject: aboutProject,
                        facility: facility,
                        unit: unit,
                        launch: launch,
                        area: area

                    })

                    // console.log(data)
                    await data.save()
                    res.status(201).json({
                        message: 'submit data successfully',
                        projectdata: data

                    })
                } else {
                    res.status(403).json({
                        message: "all field are required"
                    })
                }
            }
            else {
                res.status(403).json({
                    message: "all field are required"
                })
            }
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "internal server error . "
            })
        }
    }

    static newlaunch_view = async (req, res) => {
        try {
            const id=req.params.id
            const data = await newlaunchModel.findById(id)
            res.status(200).json({
                message:"data get successfull ! "
                ,data
            })           
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "internal server error ! "
            })
        }
    }
    static newlaunch_viewAll = async (req, res) => {
        try {
            const data = await newlaunchModel.find()
            res.status(200).json({
                message:"All data get successfull ! "
                ,data
            })
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "internal server error ! "
            })
        }
    }
    static newlaunch_edit = async (req, res) => {
        // console.log("hello")
        try {
            const id=req.params.id
            const data = await newlaunchModel.findById(id)
            res.status(200).json({
                message:"edit data get successfull ! "
                ,data
            })
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "internal server error ! "
            })
        }
    }
    static newlaunch_update = async (req, res) => {
        try {
            if (req.files) {
                if (req.files.sliderImage && req.files.sitePlan && req.files.Image2) {
                    const data = await newlaunchModel.findById(req.params.id)
                    // console.log(data)
                    const sliderid = data.sliderImage.public_id;
                    await cloudinary.uploader.destroy(sliderid)

                    const siteid = data.sitePlan.public_id;
                    await cloudinary.uploader.destroy(siteid)

                    const imageid = data.Image2.public_id;
                    await cloudinary.uploader.destroy(imageid)

                    const image = req.files.sliderImage;
                    const imageResult = await cloudinary.uploader.upload(
                        image.tempFilePath, {
                        folder: "100acre/NewLaunch"
                    }
                    );
                    const siteImage = req.files.sitePlan;
                    const site = await cloudinary.uploader.upload(
                        siteImage.tempFilePath, {
                        folder: "100acre/NewLaunch"
                    }
                    );

                    const image2 = req.files.Image2;
                    const dataviewImage = await cloudinary.uploader.upload(
                        image2.tempFilePath, {
                        folder: "100acre/NewLaunch"
                    }
                    );


                    const dataUpdate = await newlaunchModel.findByIdAndUpdate(req.params.id, {
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
                        projectName: req.body.projectName,
                        minPrice: req.body.minPrice,
                        maxPrice: req.body.maxPrice,
                        developerName: req.body.developerName,
                        bedroom: req.body.bedroom,
                        address: req.body.address,
                        state: req.body.state,
                        block: req.body.block,
                        floor: req.body.floor,
                        carparkSpace: req.body.carparkSpace,
                        nearestLandmark: req.body.nearestLandmark,
                        propertyType: req.body.propertyType,
                        aboutProject: req.body.aboutProject,
                        facility: req.body.facility,
                        unit: req.body.unit,
                        launch: req.body.launch,
                        area: req.body.area

                    })

                    // console.log(data)
                    await dataUpdate.save()
                    res.status(201).json({
                        message: 'dataupdate successfully',
                        projectdata: dataUpdate

                    })
                } else if (req.files.sliderImage) {
                    const data = await newlaunchModel.findById(req.params.id)
                    // console.log(data)
                    const sliderid = data.sliderImage.public_id;
                    await cloudinary.uploader.destroy(sliderid)

                    const image = req.files.sliderImage;
                    const imageResult = await cloudinary.uploader.upload(
                        image.tempFilePath, {
                        folder: "100acre/NewLaunch"
                    }
                    );

                    const dataUpdate = await newlaunchModel.findByIdAndUpdate(req.params.id, {
                        sliderImage: {
                            public_id: imageResult.public_id,
                            url: imageResult.secure_url
                        },
                        projectName: req.body.projectName,
                        minPrice: req.body.minPrice,
                        maxPrice: req.body.maxPrice,
                        developerName: req.body.developerName,
                        bedroom: req.body.bedroom,
                        address: req.body.address,
                        state: req.body.state,
                        block: req.body.block,
                        floor: req.body.floor,
                        carparkSpace: req.body.carparkSpace,
                        nearestLandmark: req.body.nearestLandmark,
                        propertyType: req.body.propertyType,
                        aboutProject: req.body.aboutProject,
                        facility: req.body.facility,
                        unit: req.body.unit,
                        launch: req.body.launch,
                        area: req.body.area

                    })

                    // console.log(data)
                    await dataUpdate.save()
                    res.status(201).json({
                        message: 'dataupdate successfully!',
                        projectdata: dataUpdate

                    })
                } else if (req.files.sitePlan) {
                    const data = await newlaunchModel.findById(req.params.id)
                    // console.log(data)


                    const siteid = data.sitePlan.public_id;
                    await cloudinary.uploader.destroy(siteid)

                    const siteImage = req.files.sitePlan;
                    const site = await cloudinary.uploader.upload(
                        siteImage.tempFilePath, {
                        folder: "100acre/NewLaunch"
                    }
                    );

                    const dataUpdate = await newlaunchModel.findByIdAndUpdate(req.params.id, {
                        sitePlan: {
                            public_id: site.public_id,
                            url: site.secure_url
                        },
                        projectName: req.body.projectName,
                        minPrice: req.body.minPrice,
                        maxPrice: req.body.maxPrice,
                        developerName: req.body.developerName,
                        bedroom: req.body.bedroom,
                        address: req.body.address,
                        state: req.body.state,
                        block: req.body.block,
                        floor: req.body.floor,
                        carparkSpace: req.body.carparkSpace,
                        nearestLandmark: req.body.nearestLandmark,
                        propertyType: req.body.propertyType,
                        aboutProject: req.body.aboutProject,
                        facility: req.body.facility,
                        unit: req.body.unit,
                        launch: req.body.launch,
                        area: req.body.area

                    })

                    // console.log(data)
                    await dataUpdate.save()
                    res.status(201).json({
                        message: 'su dataupdate successfully',
                        projectdata: dataUpdate

                    })
                } else if (req.files.Image2) {
                    const data = await newlaunchModel.findById(req.params.id)
                    // console.log(data)

                    const imageid = data.Image2.public_id;
                    await cloudinary.uploader.destroy(imageid)


                    const image2 = req.files.Image2;
                    const dataviewImage = await cloudinary.uploader.upload(
                        image2.tempFilePath, {
                        folder: "100acre/NewLaunch"
                    }
                    );

                    const dataUpdate = await newlaunchModel.findByIdAndUpdate(req.params.id, {
                        Image2: {
                            public_id: dataviewImage.public_id,
                            url: dataviewImage.secure_url
                        },
                        projectName: req.body.projectName,
                        minPrice: req.body.minPrice,
                        maxPrice: req.body.maxPrice,
                        developerName: req.body.developerName,
                        bedroom: req.body.bedroom,
                        address: req.body.address,
                        state: req.body.state,
                        block: req.body.block,
                        floor: req.body.floor,
                        carparkSpace: req.body.carparkSpace,
                        nearestLandmark: req.body.nearestLandmark,
                        propertyType: req.body.propertyType,
                        aboutProject: req.body.aboutProject,
                        facility: req.body.facility,
                        unit: req.body.unit,
                        launch: req.body.launch,
                        area: req.body.area

                    })

                    // console.log(data)
                    await dataUpdate.save()
                    res.status(201).json({
                        message: 'sumit dataupdate! successfully',
                        projectdata: dataUpdate

                    })
                }

            } else {
                const id = req.params.id
                const data = await newlaunchModel .findByIdAndUpdate(id, {

                    projectName: req.body.projectName,
                    minPrice: req.body.minPrice,
                    maxPrice: req.body.maxPrice,
                    developerName: req.body.developerName,
                    bedroom: req.body.bedroom,
                    address: req.body.address,
                    state: req.body.state,
                    block: req.body.block,
                    floor: req.body.floor,
                    carparkSpace: req.body.carparkSpace,
                    nearestLandmark: req.body.nearestLandmark,
                    propertyType: req.body.propertyType,
                    aboutProject: req.body.aboutProject,
                    facility: req.body.facility,
                    unit: req.body.unit,
                    launch: req.body.launch,
                    area: req.body.area

                })

                // console.log(data)
                await data.save()
                res.status(201).json({
                    message: 'sumit dataupdate successfull',
                    projectdata: data

                })
            }
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "internal server error ! "
            })
        }
    }
    static newlaunch_delete = async (req, res) => {
        try {
            const id = req.params.id
            const result = await newlaunchModel.findById(req.params.id)
            const sliderId = result.sliderImage.public_id
            if(sliderId!==null){
            await cloudinary.uploader.destroy(sliderId)
            }
          
            const siteId = result.sitePlan.public_id
            if(siteId!==null){
            await cloudinary.uploader.destroy(siteId)
            }

            const image2Id = result.Image2.public_id
            if(image2Id!==null){
            await cloudinary.uploader.destroy(image2Id)
            }
            const data = await newlaunchModel.findByIdAndDelete(id)
            res.status(201).json({
                message: 'data deleted sucessfully!',
                deletedata: data
            })
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "internal server error ! "
            })
        }
    }

}
module.exports = newlaunchController
