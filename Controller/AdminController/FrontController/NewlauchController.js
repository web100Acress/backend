
const prelaunchModel = require('../../../models/newlaunch/prelaunch');
const NodeCache = require("node-cache");
// const testModel = require('../../../models/postProperty/test');
const cache = new NodeCache();

const cloudinary = require('cloudinary').v2;
class newlaunchController {

    // PreLaunch Api 
    static preLaunch_insert = async (req, res) => {
        // console.log("hello")
        // console.log(req.body)
        try {
            const { projectName, price, city, configuration, status, featured, rera_No, minCovered_Area,
                maxCovered_Area, aboutProject, builderName, amentites, location, Aboutdeveloper, url, meta_title, meta_description } = req.body
            if (projectName && price && city && configuration && status && featured && rera_No && minCovered_Area &&
                maxCovered_Area && aboutProject && builderName && amentites && location && Aboutdeveloper && url && meta_title && meta_description) {
                if (req.files) {
                    const photo = req.files.photo
                    const floorPlan = req.files.floorPlan
                    const sitePlan = req.files.sitePlan
                    const locationMap = req.files.locationMap
                    const floorResult = await cloudinary.uploader.upload(
                        floorPlan.tempFilePath, {
                        folder: `100acre/prelaunch/${projectName}`,
                    })
                    const siteResult = await cloudinary.uploader.upload(
                        sitePlan.tempFilePath, {
                        folder: `100acre/prelaunch/${projectName}`,
                    })
                    const locationResult = await cloudinary.uploader.upload(
                        locationMap.tempFilePath, {
                        folder: `100acre/prelaunch/${projectName}`,
                    })
                    const otherImagelink = []
                    if (photo.length >= 2) {
                        for (let i = 0; i < photo.length; i++) {
                            const photoResult = await cloudinary.uploader.upload(
                                photo[i].tempFilePath, {
                                folder: `100acre/prelaunch/${projectName}`,
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
                            folder: `100acre/prelaunch/${projectName}`,
                        }
                        );
                        otherImagelink.push({
                            public_id: photoResult.public_id,
                            url: photoResult.secure_url
                        })

                    }

                    const data = new prelaunchModel({
                        floorPlan: {
                            public_id: floorResult.public_id,
                            url: floorResult.secure_url,
                        },
                        sitePlan: {
                            public_id: siteResult.public_id,
                            url: siteResult.secure_url
                        },
                        locationMap: {
                            public_id: locationResult.public_id,
                            url: locationResult.secure_url
                        },
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
                        photo: otherImagelink,
                        Aboutdeveloper: Aboutdeveloper,
                        url: url,
                        meta_title: meta_title,
                        meta_description: meta_description
                    })
                    await data.save()
                    res.status(200).json({
                        message: "Data inserted successfully ! "
                    })
                } else {
                    res.status(400).json({
                        message: "check  your image  field ! "
                    })
                }
            } else {

                res.status(400).json({
                    message: "check your field !! "
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
        console.log("hello")

        try {

        const data = await prelaunchModel.find();
          res.status(200).json({
            message:"data fetched from database ! ",
            data
          })
        } catch (error) {
          console.error(error);
          res.status(500).json({
            message: 'Internal server error!',
          });
        }
    }

    // view  the prelaunch project by their name 
    static preLaunch_view = async (req, res) => {
        // console.log("hello")
        try {
            const url = req.params.url
            if (url.length > 0) {
                const data = await prelaunchModel.find({ url: url })
                res.status(200).json({
                    message: "data get successfully ! ",
                    data
                })
            } else {
                res.status(200).json({
                    message: "query url not get ! ",

                })
            }
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
            const { projectName, price, city, configuration, status, featured, rera_No, minCovered_Area, maxCovered_Area, aboutProject, builderName, amentites, location, url, Aboutdeveloper, meta_title, meta_description
            } = req.body
            if (req.files) {
                if (req.files.photo && req.files.floorPlan && req.files.sitePlan && req.files.locationMap) {


                    const photo = req.files.photo;
                    const id = req.params.id
                    // const data=await prelaunchModel.findById({_id:id})

                    const floorPlan = req.files.floorPlan
                    const sitePlan = req.files.sitePlan
                    const locationMap = req.files.locationMap
                    const floorResult = await cloudinary.uploader.upload(
                        floorPlan.tempFilePath, {
                        // folder: "100acre/prelaunch"
                        folder: `100acre/prelaunch/${projectName}`,
                    })
                    const siteResult = await cloudinary.uploader.upload(
                        sitePlan.tempFilePath, {
                        // folder: "100acre/prelaunch"
                        folder: `100acre/prelaunch/${projectName}`,
                    })
                    const locationResult = await cloudinary.uploader.upload(
                        locationMap.tempFilePath, {
                        // folder: "100acre/prelaunch"
                        folder: `100acre/prelaunch/${projectName}`,
                    })

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
                            // folder: "100acre/prelaunch"
                            folder: `100acre/prelaunch/${projectName}`,
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
                        floorPlan: {
                            public_id: floorResult.public_id,
                            url: floorResult.secure_url,
                        },
                        sitePlan: {
                            public_id: siteResult.public_id,
                            url: siteResult.secure_url
                        },
                        locationMap: {
                            public_id: locationResult.public_id,
                            url: locationResult.secure_url
                        },
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
                        photo: otherImagelink,
                        Aboutdeveloper: Aboutdeveloper,
                        url: url,
                        meta_title: meta_title,
                        meta_description: meta_description

                    })
                    // console.log(dataupdate)
                    await dataupdate.save()
                    res.status(200).json({
                        message: " data updated successfully ! "
                    })

                } else if (req.files.photo) {
                    const photo = req.files.photo;
                    const id = req.params.id
                    // const data=await prelaunchModel.findById({_id:id})



                    const otherImagelink = []
                    if (photo.length >= 2) {
                        for (let i = 0; i < photo.length; i++) {
                            const photoResult = await cloudinary.uploader.upload(
                                photo[i].tempFilePath, {
                                // folder: "100acre/preLaunch"
                                folder: `100acre/prelaunch/${projectName}`,
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
                            // folder: "100acre/prelaunch"
                            folder: `100acre/prelaunch/${projectName}`,
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
                        photo: otherImagelink,
                        Aboutdeveloper: Aboutdeveloper,
                        url: url,
                        meta_title: meta_title,
                        meta_description: meta_description

                    })
                    // console.log(dataupdate)
                    await dataupdate.save()
                    res.status(200).json({
                        message: " data updated successfully ! "
                    })
                } else if (req.files.floorPlan) {

                    const id = req.params.id
                    // const data=await prelaunchModel.findById({_id:id})

                    const floorPlan = req.files.floorPlan

                    const floorResult = await cloudinary.uploader.upload(
                        floorPlan.tempFilePath, {
                        // folder: "100acre/prelaunch"
                        folder: `100acre/prelaunch/${projectName}`,
                    })

                    const dataupdate = await prelaunchModel.findByIdAndUpdate({ _id: id }, {
                        floorPlan: {
                            public_id: floorResult.public_id,
                            url: floorResult.secure_url,
                        },
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
                        Aboutdeveloper: Aboutdeveloper,
                        url: url,
                        meta_title: meta_title,
                        meta_description: meta_description

                    })
                    // console.log(dataupdate)
                    await dataupdate.save()
                    res.status(200).json({
                        message: " data updated successfully ! "
                    })
                } else if (req.files.sitePlan) {
                    const id = req.params.id
                    // const data=await prelaunchModel.findById({_id:id})


                    const sitePlan = req.files.sitePlan


                    const siteResult = await cloudinary.uploader.upload(
                        sitePlan.tempFilePath, {
                        // folder: "100acre/prelaunch"
                        folder: `100acre/prelaunch/${projectName}`,
                    })




                    const dataupdate = await prelaunchModel.findByIdAndUpdate({ _id: id }, {

                        sitePlan: {
                            public_id: siteResult.public_id,
                            url: siteResult.secure_url
                        },

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
                        Aboutdeveloper: Aboutdeveloper,
                        url: url,
                        meta_title: meta_title,
                        meta_description: meta_description

                    })
                    // console.log(dataupdate)
                    await dataupdate.save()
                    res.status(200).json({
                        message: " data updated successfully ! "
                    })
                } else if (req.files.locationMap) {
                    const id = req.params.id
                    // const data=await prelaunchModel.findById({_id:id})
                    const locationMap = req.files.locationMap

                    const locationResult = await cloudinary.uploader.upload(
                        locationMap.tempFilePath, {
                        // folder: "100acre/prelaunch"
                        folder: `100acre/prelaunch/${projectName}`,
                    })
                    const dataupdate = await prelaunchModel.findByIdAndUpdate({ _id: id }, {

                        locationMap: {
                            public_id: locationResult.public_id,
                            url: locationResult.secure_url
                        },
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
                        Aboutdeveloper: Aboutdeveloper,
                        url: url,
                        meta_title: meta_title,
                        meta_description: meta_description
                    })
                    // console.log(dataupdate)
                    await dataupdate.save()
                    res.status(200).json({
                        message: " data updated successfully ! "
                    })

                }
                else {
                    res.status(200).json({
                        message: "check your files !"
                    })
                }

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
                    Aboutdeveloper: Aboutdeveloper,
                    url: url,
                    meta_title: meta_title,
                    meta_description: meta_description

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
                // console.log(otherId)

                await cloudinary.uploader.destroy(otherId)
            }
            const floorPlan = otherResult.floorPlan.public_id
            await cloudinary.uploader.destroy(floorPlan)

            const sitePlan = otherResult.sitePlan.public_id
            await cloudinary.uploader.destroy(sitePlan)

            const locationMap = otherResult.locationMap.public_id
            await cloudinary.uploader.destroy(locationMap)

            await prelaunchModel.findByIdAndDelete({ _id: id })
            res.status(200).json({
                message: "Data deleted successfully ! "
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error !"
            })
        }
    }

    ///bhk details
    static preLaunch_bhkinsert = async (req, res) => {
        // console.log("hello")
        try {
            const { input_Bhk, build_area, possession } = req.body
            if (req.files) {

                const image = req.files.image;
                const id = req.params.id;
                const dataf = await prelaunchModel.findOne({ _id: id },);
                const projectName = dataf.projectName
                //   console.log(projectName)
                const imageResult = await cloudinary.uploader.upload(
                    image.tempFilePath, {
                    // folder: "100acre/preLaunch"
                    folder: `100acre/prelaunch/${projectName}`,
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
                message: "internal server error  ! ",
                error
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
                message: "Data get successfully ! ",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
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
                    { folder: `100acre/prelaunch/${data.projectName}`, }
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
                    message: "Data updated successfully ! "
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
                    message: "Data updated successfully ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
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


