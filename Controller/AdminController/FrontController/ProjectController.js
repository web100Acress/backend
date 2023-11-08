const ProjectModel = require("../../../models/projectDetail/project");
const UserModel = require("../../../models/projectDetail/user");
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config()
class projectController {


    static project = async (req, res) => {
        res.send("project")
    }
    // Project data insert api
    static projectInsert = async (req, res) => {
        // console.log("hello")
        try {
            const {
                projectName,
                minPrice, maxPrice, developerName, bedroom, address,
                state, block, floor, carparkSpace, nearestLandmark,
                propertyType, aboutProject, facility, unit, area, launch
            } = req.body

            if (projectName &&
                minPrice && maxPrice && developerName && bedroom && address &&
                state && block && floor && carparkSpace && nearestLandmark &&
                propertyType && aboutProject && facility && unit && area && launch) {
                if (req.files.sliderImage && req.files.sitePlan && req.files.Image2) {



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
                    res.status(200).json({
                        message: 'sumit data successfully',
                        projectdata: data

                    })
                } else {
                    res.status(403).json({
                        message: "check image field ! "
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
            res.status(500).json({
                message: "internal server error "
            })
        }


    }

    // project data edit
    static projectEdit = async (req, res) => {
        // console.log("project edit")
        try {
            const data = await ProjectModel.findById(req.params.id)
            res.status(201).json({
                message: "editing enable",
                dataedit: data
            })
        } catch (error) {
            console.log("error")
            res.status(500).json({
                message: "internal server error !"
            })
        }
    }
    // see project by id view details 
    static projectView = async (req, res) => {
        // console.log("helo")
        try {
            const projectName = req.params.projectName
            const data = await ProjectModel.find({ projectName: projectName })
            res.status(200).json({
                message: " enable",
                dataview: data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: "an error is occured",
            })
        }
    }
    // project data edit
    static projectUpdate = async (req, res) => {
        // console.log("update")
        try {
            // const{projectName,minPrice,maxPrice,developerName,address,state,block,floor,carparkSpace,nearestLandmark,propertyType,aboutProject,unit,launch,area}=req.body
            if (req.files) {
                if (req.files.sliderImage && req.files.sitePlan && req.files.Image2) {
                    const data = await ProjectModel.findById(req.params.id)
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


                    const dataUpdate = await ProjectModel.findByIdAndUpdate(req.params.id, {
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
                    const data = await ProjectModel.findById(req.params.id)
                    // console.log(data)
                    const sliderid = data.sliderImage.public_id;
                    await cloudinary.uploader.destroy(sliderid)

                    const image = req.files.sliderImage;
                    const imageResult = await cloudinary.uploader.upload(
                        image.tempFilePath, {
                        folder: "100acre/ProjectImage"
                    }
                    );

                    const dataUpdate = await ProjectModel.findByIdAndUpdate(req.params.id, {
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
                    const data = await ProjectModel.findById(req.params.id)
                    // console.log(data)


                    const siteid = data.sitePlan.public_id;
                    await cloudinary.uploader.destroy(siteid)

                    const siteImage = req.files.sitePlan;
                    const site = await cloudinary.uploader.upload(
                        siteImage.tempFilePath, {
                        folder: "100acre/ProjectImage"
                    }
                    );

                    const dataUpdate = await ProjectModel.findByIdAndUpdate(req.params.id, {
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
                    const data = await ProjectModel.findById(req.params.id)
                    // console.log(data)

                    const imageid = data.Image2.public_id;
                    await cloudinary.uploader.destroy(imageid)


                    const image2 = req.files.Image2;
                    const dataviewImage = await cloudinary.uploader.upload(
                        image2.tempFilePath, {
                        folder: "100acre/ProjectImage"
                    }
                    );

                    const dataUpdate = await ProjectModel.findByIdAndUpdate(req.params.id, {
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
                const data = await ProjectModel.findByIdAndUpdate(id, {

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
            res.status(500).json({
                message: "internal server error ! "
            })

        }
    }
    //findAll
    static projectviewAll = async (req, res) => {
        // console.log("all")
        try {
            const data = await ProjectModel.find()
            res.status(200).json({
                message: "all data get !",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! "
            })
        }
    }
    //  project data delete
    static projectDelete = async (req, res) => {
        // console.log("helo")
        try {
            const id = req.params.id
            const result = await ProjectModel.findById({ _id: id })
            const sliderId = result.sliderImage.public_id
            await cloudinary.uploader.destroy(sliderId)

            const siteId = result.sitePlan.public_id
            await cloudinary.uploader.destroy(siteId)

            const image2Id = result.Image2.public_id
            await cloudinary.uploader.destroy(image2Id)

            const data = await ProjectModel.findByIdAndDelete({ _id: id })
            res.status(202).json({
                message: 'data deleted sucessfully!',
                deletedata: data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error !"
            })
        }
    } // Enquiry form for the Project detail page api

    static userInsert = async (req, res) => {
        // console.log("helo")
        // const data =new UserModel

        try {
            const { name, email, mobile, projectName, address,status } = req.body
            if (name && email && mobile && projectName && address &&status) {
                const data = new UserModel({
                    name: name,
                    email: email,
                    mobile: mobile,
                    projectName: projectName,
                    address: address,
                    status:status
                })


                // Connect with SMTP Gmail
                const transporter = await nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    auth: {
                        user: process.env.Email,
                        pass: process.env.EmailPass
                    },
                });
                // Send mail with defined transport object
                let info = await transporter.sendMail({
                    from: 'test@gmail.com', // Sender address
                    to: 'query.aadharhomes@gmail.com', // List of receivers (admin's email) =='query.aadharhomes@gmail.com'
                    subject: 'New User Enquiry Detail', // Subject line
                    text: '', // Plain text body
                    html: `
                    <div class="card">
                     <div>
                    <div class="header">
                    <h2>User Customer Contact Detail</h2>
                    </div>
                    </div>
                    <center>
                    <div> User Customer Contact  Detail:</div>
                    <div><h3>UserName:${data.name}</h3></div>
                    <div><h3>UserEmailId:${data.email}</h3></div>
                    <div><h3>UserMobileNo.:${data.mobile}</h3></div>
                    <div><h3>ProjectName:${data.projectName}</h3></div>
                    <div><h3>Address:${data.address}</h3></div>
                    <center>
        
                     <br>
     
                     </div>
         `, // HTML body
                    // html:`<!DOCTYPE html>
                    // <html lang="en">
                    // <head>
                    //     <meta charset="UTF-8">
                    //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    //     <title>User Contact Details</title>
                    //     <style>
                    //         body {
                    //             font-family: Arial, sans-serif;
                    //             background-color: #f2f2f2;
                    //             margin: 0;
                    //             padding: 0;
                    //         }

                    //         .card {
                    //             max-width: 600px;
                    //             margin: 0 auto;
                    //             padding: 20px;
                    //             background-color: #fff;
                    //             border-radius: 10px;
                    //             box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    //         }

                    //         .header {
                    //             background-color: #007bff;
                    //             color: #fff;
                    //             text-align: center;
                    //             padding: 10px;
                    //             border-radius: 10px 10px 0 0;
                    //         }

                    //         h2 {
                    //             margin: 0;
                    //         }

                    //         .details {
                    //             padding: 20px;
                    //             text-align: center;
                    //         }

                    //         h3 {
                    //             margin: 10px 0;
                    //             color: #333;
                    //         }

                    //         .footer {
                    //             background-color: #007bff;
                    //             color: #fff;
                    //             text-align: center;
                    //             padding: 10px;
                    //             border-radius: 0 0 10px 10px;
                    //         }
                    //     </style>
                    // </head>
                    // <body>
                    //     <div class="card">

                    //         <div class="details">
                    //             <div>User Customer Contact Detail:</div>
                    //             <h3>UserName: ${data.name}</h3>
                    //             <h3>UserEmailId: ${data.email}</h3>
                    //             <h3>UserMobileNo.: ${data.mobile}</h3>
                    //             <h3>ProjectName: ${data.project}</h3>
                    //             <h3>Address: ${data.address}</h3>
                    //         </div>

                    //     </div>
                    // </body>
                    // </html>
                    // `
                });
                await data.save()
                res.status(201).json({
                    message: "User data submitted successfully , and the data has been sent via email",
                    dataInsert: data
                })
            } else {
                res.status(400).json({
                    message: "some parameter are missing !"
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error !"
            })
        }
    }

    static userviewAll = async (req, res) => {
        // console.log("hello")
        try {
            const data = await UserModel.find()
            res.status(200).json({
                message: "Data retrived successfully !",
                data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! "
            })
        }
    }
    // user data
    //delete
    static userdataDelete = async (req, res) => {
        // console.log('hello delete')
        try {
            const id = req.params.id;
            const data = await UserModel.findByIdAndDelete({ _id: id })

            res.status(204).json({
                message: "User data deleted successfully ! ",

            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! "
            })
        }
    }

}
module.exports = projectController
