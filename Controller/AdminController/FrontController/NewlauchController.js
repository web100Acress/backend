const newlaunchModel = require('../../../models/newlaunch/newProject');
const prelaunchModel = require('../../../models/newlaunch/prelaunch');

const cloudinary = require('cloudinary').v2;
class newlaunchController {

    //   data insert api Newlaunch
    static newlaunch_Insert = async (req, res) => {
        try {
            const {
                projectName, minPrice, maxPrice, developerName, bedroom, address, state, block, floor, carparkSpace, nearestLandmark, propertyType, facility, unit, launch, area, aboutProject } = req.body

            if (projectName && minPrice && maxPrice && developerName && bedroom && address && state && block && floor && carparkSpace && nearestLandmark && propertyType && facility && unit && launch && area && aboutProject) {
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
    // data view for newlaunch by id
    static newlaunch_view = async (req, res) => {
        try {
            const id = req.params.id
            const data = await newlaunchModel.findById(id)
            res.status(200).json({
                message: "data get successfully ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "Internal server error ! "
            })
        }
    }

    static newlaunch_projectName = async (req, res) => {
        // console.log("hello")
        try {
            const projectName = req.params.projectName
            const data = await newlaunchModel.find({ projectName: projectName })
            res.status(200).json({
                message: "data get successfully ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "Internal server error ! "
            })
        }
    }
    //viewAll
    static newProject = async (req, res) => {

        try {
            const data = await newlaunchModel.find()
            // res.send(data)
            res.status(200).json({
                message: "data get",
                data: data
            })
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "internal server error ! "
            })
        }
    }
    // edit new Launch data
    static newlaunch_edit = async (req, res) => {
        // console.log("hello")
        try {
            const id = req.params.id
            const data = await newlaunchModel.findById(id)
            res.status(200).json({
                message: "edit data get successfull ! "
                , data
            })
        } catch (error) {
            console.log(error)
            res.send(500).json({
                message: "internal server error ! "
            })
        }
    }
    // update data for new Launch data 
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
                const data = await newlaunchModel.findByIdAndUpdate(id, {

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
            if (sliderId !== null) {
                await cloudinary.uploader.destroy(sliderId)
            }

            const siteId = result.sitePlan.public_id
            if (siteId !== null) {
                await cloudinary.uploader.destroy(siteId)
            }

            const image2Id = result.Image2.public_id
            if (image2Id !== null) {
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

    ///////////////////////////////////////////////////////////prelaunch

    static preLaunch_insert = async (req, res) => {
        // console.log("hello")
        // console.log(req.body)
        try {
            const { projectName, price, city, configuration, status, featured, rera_No, minCovered_Area,
                maxCovered_Area, aboutProject, builderName, amentites, location } = req.body
            if (projectName && price && city && configuration && status && featured && rera_No && minCovered_Area &&
                maxCovered_Area && aboutProject && builderName && amentites && location) {
                const photo = req.files.photo
                const otherImagelink = []
                if (photo.length >= 2) {
                    for (let i = 0; i < photo.length; i++) {
                        const photoResult = await cloudinary.uploader.upload(
                            photo[i].tempFilePath, {
                            folder: "100acre/preLaunch"
                        }
                        );
                        otherImagelink.push({
                            public_id: photoResult.public_id,
                            url: photoResult.secure_url
                        })
                    }
                } else {
                    const photoResult = await cloudinary.uploader.upload(
                        photo.tempFilePath, {
                        folder: "100acre/prelaunch"
                    }
                    );
                    otherImagelink.push({
                        public_id: photoResult.public_id,
                        url: photoResult.secure_url
                    })

                }
                const data = new prelaunchModel({
                    projectName: projectName,
                    price: price,
                    city: city,
                    configuration: configuration,
                    status: status,
                    featured: featured,
                    rera_No: rera_No,
                    minCovered_Area: minCovered_Area,
                    maxCovered_Area: maxCovered_Area,
                    aboutProject: aboutProject,
                    builderName: builderName,
                    amentites: amentites,
                    location: location,
                    photo: otherImagelink


                })
                await data.save()
                res.status(200).json({
                    message: "data inserted successfull ! "
                })
            } else {
                // res.status(204).json({
                //     message: "check your field ! "
                // })
                res.status(400).json({
                    message: "check your field ! "
                })
            }

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    // viewAll
    static preLaunch_viewAll = async (req, res) => {
        // console.log("hello")
        try {
            const data = await prelaunchModel.find()
            res.status(200).json({
                message: " data get ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    // view
    static preLaunch_view = async (req, res) => {
        // console.log("hello")
        try {
            const id = req.params.id
            const data = await prelaunchModel.findById({ _id: id })
            res.send(data)

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    // edit
    static preLaunch_edit = async (req, res) => {
        // console.log("helo")
        try {
            const id = req.params.id
            const data = await prelaunchModel.findById({ _id: id })
            // res.send(data)
            res.status(200).json({
                message: "data get for edit ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    // update 
    static prelaunch_update = async (req, res) => {

        try {
            const { projectName, price, city, configuration, status, featured, rera_No, minCovered_Area, maxCovered_Area, aboutProject, builderName, amentites, location } = req.body
            if (req.files) {
                const photo = req.files.photo;
                const id = req.params.id
                // const data=await prelaunchModel.findById({_id:id})
                const otherImagelink = []
                if (photo.length >= 2) {
                    for (let i = 0; i < photo.length; i++) {
                        const photoResult = await cloudinary.uploader.upload(
                            photo[i].tempFilePath, {
                            folder: "100acre/preLaunch"
                        }
                        );
                        otherImagelink.push({
                            public_id: photoResult.public_id,
                            url: photoResult.secure_url
                        })
                    }
                } else {
                    const photoResult = await cloudinary.uploader.upload(
                        photo.tempFilePath, {
                        folder: "100acre/prelaunch"
                    }
                    );
                    otherImagelink.push({
                        public_id: photoResult.public_id,
                        url: photoResult.secure_url
                    })

                }
                const result = await prelaunchModel.findById(req.params.id)
                for (let i = 0; i < result.photo.length; i++) {
                    otherImagelink.push(
                        result.photo[i]
                    );
                }

                const dataupdate = await prelaunchModel.findByIdAndUpdate({ _id: id }, {
                    projectName: projectName,
                    price: price,
                    city: city,
                    configuration: configuration,
                    status: status,
                    featured: featured,
                    rera_No: rera_No,
                    minCovered_Area: minCovered_Area,
                    maxCovered_Area: maxCovered_Area,
                    aboutProject: aboutProject,
                    builderName: builderName,
                    amentites: amentites,
                    location: location,
                    photo: otherImagelink
                })
                // console.log(dataupdate)
                await dataupdate.save()
                res.status(200).json({
                    message: " data updadated successfully ! "
                })

            } else {
                const id = req.params.id
                const dataupdate = await prelaunchModel.findByIdAndUpdate({ _id: id }, {
                    projectName: projectName,
                    price: price,
                    city: city,
                    configuration: configuration,
                    status: status,
                    featured: featured,
                    rera_No: rera_No,
                    minCovered_Area: minCovered_Area,
                    maxCovered_Area: maxCovered_Area,
                    aboutProject: aboutProject,
                    builderName: builderName,
                    amentites: amentites,
                    location: location,

                })
                // console.log(dataupdate)
                await dataupdate.save()
                res.status(200).json({
                    message: "data updated successfully ! "
                })
            }

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }

    //delete
    static prelaunch_delete = async (req, res) => {
        // console.log("helllo")
        try {
            const id = req.params.id;

            const result = await prelaunchModel.findById({ _id: id })
            // const imageId = result.photo.public_id
            // console.log(imageId)
            for (let i = 0; i < result.length; i++) {
                const otherResult = await buyCommercial_Model.findById({ _id: id })
                const otherId = otherResult.photo[i].public_id
                console.log(otherId)
                await cloudinary.uploader.destroy(otherId)
            }
            await prelaunchModel.findByIdAndDelete({ _id: id })
            res.status(200).json({
                message: "Data deleted successfully ! "
            })
        } catch (error) {

        }
    }

    ////////////////////////////bhk details
    static preLaunch_bhkinsert = async (req, res) => {
        // console.log("hello")
        try {
            const { input_Bhk, build_area, possession } = req.body
            if (req.files) {
                const image = req.files.image;
                const imageResult = await cloudinary.uploader.upload(
                    image.tempFilePath, {
                    folder: "100acre/preLaunch"
                }
                )
                const data = {
                    image: {
                        public_id: imageResult.public_id,
                        url: imageResult.secure_url
                    },
                    input_Bhk: input_Bhk,
                    build_area: build_area,
                    possession: possession,

                }
                // console.log(data)
                const id = req.params.id
                const dataPushed = await prelaunchModel.findOneAndUpdate(
                    { _id: id },
                    { $push: { BHK_details: data } },
                    { new: true }
                )
                // console.log(dataPushed)
                await dataPushed.save()
                res.status(200).json({
                    message: "data updated successfully ! "
                })
            } else {
                res.status(204).json({
                    message: "check your field ! "
                })

            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error  ! "
            })
        }
    }

    static preLaunch_bhkview = async (req, res) => {
        // console.log("helllo")
        try {
            const id = req.params.id;
            const data = await prelaunchModel.findOne({ "BHK_details._id": id },
                {
                    BHK_details: {
                        $elemMatch: {
                            _id: id,
                        },
                    },
                },
            );
            // console.log(data)
            res.status(200).json({
                message: "data get successfull ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! "
            })
        }
    }

    static prelaunch_bhkedit = async (req, res) => {
        try {
            const id = req.params.id
            const data = await prelaunchModel.findOne({ "BHK_details._id": id },
                {
                    BHK_details: {
                        $elemMatch: {
                            _id: id
                        }
                    }
                }
            )
            // console.log(data)
            res.status(200).json({
                message: "data get successfully ! ",
                data
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    static preLaunch_bhkupdate = async (req, res) => {
        // console.log("hello")
        try {
            const { input_Bhk, build_area, possession } = req.body
            if (req.files) {
                const image = req.files.image;
                const id = req.params.id
                const data = await prelaunchModel.findOne({ "BHK_details._id": id },
                    {
                        BHK_details: {
                            $elemMatch: {
                                _id: id
                            }
                        }
                    }
                )
                const imageId = data.BHK_details[0].image.public_id
                //  console.log(imageId)
                await cloudinary.uploader.destroy(imageId)
                const imageResult = await cloudinary.uploader.upload(
                    image.tempFilePath,
                    { folder: "100acre/preLaunch" }
                )

                const update = {
                    image: {
                        public_id: imageResult.public_id,
                        url: imageResult.secure_url
                    },
                    input_Bhk: input_Bhk,
                    build_area: build_area,
                    possession: possession,
                }
                const dataUpdate = await prelaunchModel.findOneAndUpdate(
                    { 'BHK_details._id': id }, { $set: { 'BHK_details.$': update } }, { new: true }
                )
                // console.log(dataUpdate)
                res.status(200).json({
                    message: "data updated successfully ! "
                })
            } else {
                const id = req.params.id;
                // console.log(id)
                // const data= await prelaunchModel.findOne({"BHK_details._id":id},
                // {
                //     BHK_details:{
                //         $elemMatch:{
                //             _id:id
                //         }
                //     }
                // } 
                // )
                // console.log(data)
                const data = {
                    input_Bhk: input_Bhk,
                    build_area: build_area,
                    possession: possession
                }

                const dataUpdate = await prelaunchModel.findOneAndUpdate(
                    { "BHK_details._id": id }, { $set: { "BHK_details.$": data } }
                )

                //    console.log(dataUpdate)
                res.status(200).json({
                    message: "data updated successfully ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! "
            })
        }
    }

    static preLaunch_delete = async (req, res) => {
        // console.log("hello")
        try {
            const id = req.params.id
            //  console.log(id)
            const data = await prelaunchModel.findOne({ "BHK_details._id": id },

                {
                    BHK_details: {
                        $elemMatch: {
                            _id: id
                        }
                    }
                }
            )
            // console.log(data)
            const imageId = data.BHK_details[0].image.public_id
            // console.log(imageId)
            if (imageId.length > 0) {
                await cloudinary.uploader.destroy(imageId)
            }
            const update = {
                $pull: {
                    BHK_details: {
                        _id: id
                    }
                }
            }
            const dataUpdate = await prelaunchModel.updateOne(update)
            res.status(200).json({
                message: " deleted successfully"
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }

}
module.exports = newlaunchController


