const ProjectModel = require("../../../models/projectDetail/project");
const projectBannerModel = require("../../../models/projectDetail/projectBanner");
const UserModel = require("../../../models/projectDetail/user");
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config()
class projectController {


    static project = async (req, res) => {
        res.send("project")
    }

    //banner for project detail page  
    //insert
    static projectbannerInsert = async (req, res) => {
        // console.log("hello banner insert")
        try {
            const { projectName, unit, launch, descripation } = req.body
            if (projectName && unit && launch && descripation && req.files) {
                const image = req.files.bannerImage;
                const imageResult = await cloudinary.uploader.upload(
                    image.tempFilePath, {
                    folder: "100acre/ProjectbannerImage"
                }
                )

                const data = new projectBannerModel({
                    bannerImage: {
                        public_id: imageResult.public_id,
                        url: imageResult.secure_url
                    },
                    projectName: projectName,
                    unit: unit,
                    launch: launch,
                    descripation: descripation
                })
                await data.save()
                res.status(201).json({
                    message: "data sucessfully inserted"
                })

            } else {
                res.status(403).json({
                    message: "all field are required!"
                })
            }
        } catch (error) {
            console.log(error)
        }
    }

    //edit
    static projectbannerEdit = async (req, res) => {
        // console.log("hello banner edit")
        try {
            const id = req.params.id
            const data = await projectBannerModel.findById(id)

            res.status(201).json({
                message: "editing is enable !"
            })
        } catch (error) {
            console.log(error)
        }
    }

    //update
    static projectbannerUpdate = async (req, res) => {
        // console.log("hello update")
        try {
            const { projectName, unit, launch, descripation } = req.body
            if (projectName && unit && launch && descripation) {
                if (req.files) {
                    const image = req.fils.bannerImage;
                    const id = req.params.id
                    const data = await projectBannerModel.findById(id)
                    const imagId = data.bannerImage.public_id
                    await cloudinary.uploader.upload.destroy(imagId)


                    const imageresult = await cloudinary.uploader.upload(
                        image.tempFilePath,
                        {
                            folder: "100acre/ProjectbannerImage"
                        }
                    )
                    const dataUpdate = await projectBannerModel.findByIdAndUpdate(id, {
                        imageresult: {
                            public_id: imageresult.public_id,
                            url: imageresult.secure_url
                        },
                        projectName: projectName,
                        unit: unit,
                        launch: launch,
                        descripation: descripation

                    })
                    await dataUpdate.save()
                    res.status(201).json({
                        message: "update data sucessfully!"
                    })

                } else {
                    const dataupdate=await projectBannerModel.findByIdAndUpdate(req.params.id,{
                        projectName: projectName,
                        unit: unit,
                        launch: launch,
                        descripation: descripation
                    })
                    await dataupdate.save()
                    res.status(201).json({
                        message: "update data sucessfully!"
                    })
                }

            } else {
                res.status(403).json({
                    message: "not updated data sucessfully!"
                })
            }
        } catch (error) {
          console.log(error)
        }
    }

    //delete
    static projectbannerDelete = async (req, res) => {
        // console.log("hello banner delete")
        try {
            const id=req.params.id;
            const data= await projectBannerModel.findByIdAndDelete(id)
            res.status(201).json({
                message:"delete"
            })
        } catch (error) {
            console.log(error)
        }
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
    static projectEdit = async (req, res) => {
        console.log("project edit")
        try {
            const data = await ProjectModel.findById(req.params.id)
            res.status(201).json({
                message: "editing enable",
                dataedit: data
            })
        } catch (error) {
            console.log("error")
        }
    }
    // project data edit
    static projectUpdate = async (req, res) => {
        console.log("update")
        try {
            if (req.files) {
                // const slider=req.files.sliderImage;
                // const site=req.files.sitePlan;
                // const image=req.files.image2;

                const data = await ProjectModel.findById(req.params.id)
                // console.log(data)
                const sliderid = data.sliderImage.public_id;
                await cloudinary.uploader.destroy(sliderid)

                const siteid = data.sitePlan.public_id;
                await cloudinary.uploader.destroy(siteid)

                const imageid = data.image2.public_id;
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


                })

                // console.log(data)
                await dataUpdate.save()
                res.status(201).json({
                    message: 'sumit dataupdate successfully',
                    projectdata: dataUpdate

                })
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


                })

                // console.log(data)
                await data.save()
                res.status(201).json({
                    message: 'sumit dataupdate successfully',
                    projectdata: data

                })
            }
        } catch (error) {
            console.log(error)
        }
    }

    //  project data delete
    static projectDelete = async (req, res) => {
        // console.log("helo")
        try {
            const id = req.params.id
            const data = await ProjectModel.findByIdAndDelete(id)
            res.status(201).json({
                message: 'data deleted sucessfully!',
                deletedata: data
            })
        } catch (error) {
            console.log(error)
        }
    }
    // Enquiry form for the Project detail page api

    static userInsert = async (req, res) => {
        console.log("helo")
        // const data =new UserModel

        try {
            const { name, email, mobile, projectName } = req.body
            if (name && email && mobile && projectName) {
                const data = new UserModel({
                    name: name,
                    email: email,
                    mobile: mobile,
                    projectName: projectName
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
                    to: 'amit8601396382@gmail.com', // List of receivers (admin's email) =='query.aadharhomes@gmail.com'
                    subject: 'New User Enquiry Detail', // Subject line
                    text: '', // Plain text body
                    html: `
        <div class="card">
          <div>
           <center>
             <h2>New User Enquiey Detail</h2>
           <center>
          </div>
          <center>
          <div> User Customer Contact  Detail:</div>
          <div><h3>UserName:${data.name}</h3></div>
          <div><h3>UserEmailId:${data.email}</h3></div>
          <div><h3>UserMobileNo.:${data.mobile}</h3></div>
          <div><h3>ProjectName:${data.project}</h3></div>
          <center>
        
          <br>
     
         </div>
        // `, // HTML body

                });
                await data.save()
                res.status(201).json({
                    message: "done"
                })
            } else {
                res.status(403).json({
                    message: "not success"
                })
            }
        } catch (error) {

        }
    }
    // user data
    static userdataDelete = async (req, res) => {
        // console.log('hello delete')

        try {
            const id = req.params.id;
            const data = await UserModel.findByIdAndDelete(id)

            res.status(201).json({
                message: "message delete",
                datadelete: data
            })
        } catch (error) {
            console.log(error)
        }
    }

}
module.exports = projectController


