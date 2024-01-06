const ProjectModel = require("../../../models/projectDetail/project");
const UserModel = require("../../../models/projectDetail/user");
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config()
const NodeCache = require("node-cache");
const cache = new NodeCache();

class projectController {

    static project = async (req, res) => {
        res.send("project")
    }
    // Project data insert api
    static projectInsert = async (req, res) => {
        try {
            const {
                projectName,
                projectAddress,
                state,
                project_discripation,
                builderName,
                AboutDeveloper,
                projectRedefine_Connectivity,
                projectRedefine_Entertainment,
                projectRedefine_Business,
                projectRedefine_Education,
                meta_title,
                meta_description,
                Amenities,
                projectBgContent,
                projectReraNo,
            } = req.body
            if (projectName && projectAddress && state && project_discripation && builderName && AboutDeveloper && projectRedefine_Connectivity &&
                projectRedefine_Entertainment && projectRedefine_Business && projectRedefine_Education && meta_title &&
                meta_description && Amenities && projectBgContent && projectReraNo) {
                //   console.log("hello")

                if (req.files) {
                    if (req.files.logo && req.files.project_Bg1 && req.files.project_locationImage && req.files.project_floorplan_Image) {

                        const logo = req.files.logo;
                        const logo_Result = await cloudinary.uploader.upload(
                            logo.tempFilePath, {
                            folder: `100acre/project/${projectName}`
                        }
                        )

                        const project_Bg1 = req.files.project_Bg1;
                        const projectBgResult = await cloudinary.uploader.upload(
                            project_Bg1.tempFilePath, {
                            folder: `100acre/project/${projectName}`
                        }
                        )

                        const project_locationImage = req.files.project_locationImage;
                        const projectLocationResult = await cloudinary.uploader.upload(
                            project_locationImage.tempFilePath, {
                            folder: `100acre/project/${projectName}`
                        }
                        )
                        const project_floorplan = req.files.project_floorplan_Image;
                        const floorImageLink = []

                        if (project_floorplan.length >= 2) {
                            for (let i = 0; i < project_floorplan.length; i++) {
                                const project_floorplanResult = await cloudinary.uploader.upload(
                                    project_floorplan[i].tempFilePath, {
                                    folder: `100acre/project/${projectName}`
                                }
                                );
                                floorImageLink.push({
                                    public_id: project_floorplanResult.public_id,
                                    url: project_floorplanResult.secure_url
                                })
                            }
                        } else {
                            const project_floorplanResult = await cloudinary.uploader.upload(
                                project_floorplan.tempFilePath, {
                                folder: `100acre/project/${projectName}`
                            }
                            );
                            floorImageLink.push({
                                public_id: project_floorplanResult.public_id,
                                url: project_floorplanResult.secure_url
                            })

                        }
                        const data = new ProjectModel({
                            logo: {
                                public_id: logo_Result.public_id,
                                url: logo_Result.secure_url
                            },

                            project_Bg1: {
                                public_id: projectBgResult.public_id,
                                url: projectBgResult.secure_url
                            },
                            project_locationImage: {
                                public_id: projectLocationResult.public_id,
                                url: projectLocationResult.secure_url

                            },
                            project_floorplan_Image: floorImageLink,
                            projectName: projectName,
                            projectAddress: projectAddress,
                            state: state,
                            project_discripation: project_discripation,
                            builderName: builderName,
                            AboutDeveloper: AboutDeveloper,
                            projectRedefine_Business: projectRedefine_Business,
                            projectRedefine_Connectivity: projectRedefine_Connectivity,
                            projectRedefine_Education: projectRedefine_Education,
                            projectRedefine_Entertainment: projectRedefine_Entertainment,
                            meta_title: meta_title,
                            meta_description: meta_description,
                            Amenities: Amenities,
                            projectBgContent: projectBgContent,
                            projectReraNo: projectReraNo

                        })
                        // console.log(data)
                        await data.save()
                        res.status(200).json({
                            message: "Data inserted successfully ! "
                        })
                    } else {
                        res.status(403).json({
                            message: "check Image field ! "
                        })
                    }
                } else {
                    res.status(403).json({
                        message: "All fields are required ! "
                    })
                }

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
            res.status(200).json({
                message: "data edit is enable  ! ",
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
        //console.log("hello")
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
            // res.send("helelo")
            const {
                projectName,
                projectAddress,
                state,
                project_discripation,
                builderName,
                AboutDeveloper,
                projectRedefine_Connectivity,
                projectRedefine_Entertainment,
                projectRedefine_Business,
                projectRedefine_Education,
                meta_title,
                meta_description,
                Amenities,
                projectBgContent,
                projectReraNo,
            } = req.body
            const id=req.params.id
            if (projectName && state && projectAddress && project_discripation && builderName && AboutDeveloper && projectRedefine_Business
                && projectRedefine_Connectivity && projectRedefine_Entertainment && projectRedefine_Education && meta_title
                && meta_description && Amenities && projectBgContent && projectReraNo) {
                if (req.files) {
                   
                    if (req.files.logo && req.files.project_floorplan_Image && req.files.project_Bg1 && req.files.project_locationImage) {
                        console.log("hello" ,id)
                        const logo = req.files.logo;
                        const logo_Result = await cloudinary.uploader.upload(
                            logo.tempFilePath, {
                            folder: `100acre/project/${projectName}`
                        }
                        )
                        const project_Bg1 = req.files.project_Bg1;
                        const projectBgResult = await cloudinary.uploader.upload(
                            project_Bg1.tempFilePath, {
                            folder: `100acre/project/${projectName}`
                        }
                        )

                        const project_locationImage = req.files.project_locationImage;
                        const projectLocationResult = await cloudinary.uploader.upload(
                            project_locationImage.tempFilePath, {
                            folder: `100acre/project/${projectName}`
                        }
                        )

                        const project_floorplan = req.files.project_floorplan_Image;
                        const floorImageLink = []
                        if (project_floorplan.length >= 2) {
                            for (let i = 0; i < project_floorplan.length; i++) {
                                const project_floorplanResult = await cloudinary.uploader.upload(
                                    project_floorplan[i].tempFilePath, {
                                    folder: `100acre/project/${projectName}`
                                }
                                );
                                floorImageLink.push({
                                    public_id: project_floorplanResult.public_id,
                                    url: project_floorplanResult.secure_url
                                })
                            }
                        } else {
                            const project_floorplanResult = await cloudinary.uploader.upload(
                                project_floorplan.tempFilePath, {
                                folder: `100acre/project/${projectName}`
                            }
                            );
                            floorImageLink.push({
                                public_id: project_floorplanResult.public_id,
                                url: project_floorplanResult.secure_url
                            })

                        }
                        const data =await ProjectModel.findByIdAndUpdate({_id:id},{
                            logo: {
                                public_id: logo_Result.public_id,
                                url: logo_Result.secure_url
                            },

                            project_Bg1: {
                                public_id: projectBgResult.public_id,
                                url: projectBgResult.secure_url
                            },
                            project_locationImage: {
                                public_id: projectLocationResult.public_id,
                                url: projectLocationResult.secure_url

                            },
                            project_floorplan_Image: floorImageLink, 
                            projectName:projectName,
                            state:state,
                            project_discripation:project_discripation,
                            builderName:builderName,
                            AboutDeveloper:AboutDeveloper,
                            projectRedefine_Connectivity:projectRedefine_Connectivity,
                            projectRedefine_Entertainment:projectRedefine_Entertainment,
                            projectRedefine_Business:projectRedefine_Business,
                            projectRedefine_Education:projectRedefine_Education,
                            meta_title:meta_title,
                            meta_description:meta_description,
                            Amenities:Amenities,
                            projectBgContent:projectBgContent,
                            projectReraNo:projectReraNo,


                        })
                        await data.save()
                        res.status(200).json({
                            message:"data updated suceessfully !"
                        })

                    }
                    else if(req.files.logo){
                        const logo=req.files.logo;
                         const logo_Result=await cloudinary.uploader.upload(
                            logo.tempFilePath,{
                                folder:`100acre/project/${projectName}`
                            }
                         )
                       const data= await ProjectModel.findByIdAndUpdate({_id:id},{
                        logo:{
                            public_id:logo_Result.public_id,
                            url:logo_Result.secure_url
                        },
                        projectName:projectName,
                        state:state,
                        projectAddress:projectAddress,
                        project_discripation:project_discripation,
                        builderName:builderName,
                        AboutDeveloper:AboutDeveloper,
                        projectRedefine_Business:projectRedefine_Business,
                        projectRedefine_Connectivity:projectRedefine_Connectivity,
                        projectRedefine_Education:projectRedefine_Education,
                        projectRedefine_Entertainment:projectRedefine_Entertainment,
                        meta_title:meta_title,
                        meta_description:meta_description,
                        Amenities:Amenities,
                        projectBgContent:projectBgContent,
                        projectReraNo:projectReraNo

                       } )

                       console.log(data)
                    }
                    else if(req.files.project_Bg1){
                       const project_Bg1=req.files.project_Bg1;
                       const projectBgResult=await cloudinary.uploader.upload(
                        project_Bg1.tempFilePath,{
                            folder:`100acre/project/${projectName}`
                        }
                       ) 
                       const data= await ProjectModel.findByIdAndUpdate({_id:id},{
                        project_Bg1:{
                            public_id:projectBgResult.public_id,
                            url:projectBgResult.secure_url
                        },
                        projectName:projectName,
                        state:state,
                        projectAddress:projectAddress,
                        project_discripation:project_discripation,
                        AboutDeveloper:AboutDeveloper,
                        buildername:builderName,
                        projectRedefine_Business:projectRedefine_Business,
                        projectRedefine_Connectivity:projectRedefine_Connectivity,
                        projectRedefine_Education:projectRedefine_Education,
                        meta_title:meta_title,
                        meta_descripation:meta_description,
                        Amenities:Amenities,
                        projectBgContent:projectBgContent,
                        projectReraNo:projectReraNo

                       })
                    //    console.log(data)
                    await data.save()
                    res.status(200).json({
                        message:"data updated successfully !"
                    })
                    }
                    else if(req.files.project_locationImage){
                        const project_location=req.files.project_locationImage;
                        const projectLocationResult=await cloudinary.uploader.upload(
                            project_location.tempFilePath,{
                                folder:`100acre/project/${projectName}`
                            }
                        )
                        const data=await ProjectModel.findByIdAndUpdate({_id:id},{
                          project_locationImage:{
                            public_id:projectLocationResult.public_id,
                            url:projectLocationResult.secure_url
                          },
                          projectName:projectName,
                          state:state,
                          project_discripation:project_discripation,
                          projectAddress:projectAddress,
                          builderName:builderName,
                          AboutDeveloper:AboutDeveloper,
                          projectRedefine_Business:projectRedefine_Business,
                          projectRedefine_Connectivity:projectRedefine_Connectivity,
                          projectRedefine_Education:projectRedefine_Education,
                          projectRedefine_Entertainment:projectRedefine_Entertainment,
                          Amenities:Amenities,
                          meta_title:meta_title,
                          meta_description:meta_description,
                          projectBgContent:projectBgContent,
                          projectReraNo:projectReraNo

                        })
                        await data.save()
                        res.status(200).json({
                            message:"data updated successfully !"
                        })
                    }else if(req.files.project_floorplan_Image){
                        // console.log("hello")
                        const project_floorplan=req.files.project_floorplan_Image;
                        const floorImageLink=[]
                        if(project_floorplan.length>=2){
                            for(i=0;i<project_floorplan.length;i++){
                                const project_floorplanResult=await cloudinary.uploader.upload(
                                    project_floorplan[i].tempFilePath,{

                                    }
                                )
                            }
                        }
                    
                    }
                }
            } else { }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: 'Internal server error ! '
            })
        }

    }
    //findAll
    static projectviewAll = async (req, res) => {
        try {
            const cachedData = cache.get('setData')
            if (cachedData) {
                return res.status(201).json({
                    message: "data fetched from cache !",
                    data: cachedData
                })
            }

            const data = await ProjectModel.find()
            cache.set('setData', data)
            res.status(200).json({
                message: "All project Data get  !",
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
    }

    // Enquiry form for the Project detail page api
    static userInsert = async (req, res) => {
        // console.log("helo")
        // const data =new UserModel
        try {
            const { name, email, mobile, projectName, address, status } = req.body
            if (email && mobile) {
                const data = new UserModel({
                    name: name,
                    email: email,
                    mobile: mobile,
                    projectName: projectName,
                    address: address,
                    status: status
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
                    <h2>Customer Contact Detail</h2>
                    </div>
                    </div>
                    <center>
                    <div>  Customer Contact  Detail:</div>
                    <div><h3>UserName:${data.name}</h3></div>
                    <div><h3>UserEmailId:${data.email}</h3></div>
                    <div><h3>UserMobileNo.:${data.mobile}</h3></div>
                    <div><h3>ProjectName:${data.projectName}</h3></div>
                    <div><h3>Address:${data.address}</h3></div>
                    <center>
        
                     <br>
     
                     </div>
         `,
                });
                await data.save()
                res.status(201).json({
                    message: "User data submitted successfully , and the data has been sent via email",
                    dataInsert: data
                })
            } else {
                res.status(403).json({
                    message: "check field ;"
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error !"
            })
        }
    }
    //    user data view All
    static userviewAll = async (req, res) => {
        // console.log("hello")
        try {
            const cachedData = cache.get('setData')
            if (cachedData) {
                return res.status(201).json({
                    message: "data fetched from cache !",
                    data: cachedData
                })
            }

            const data = await UserModel.find()
            cache.set('setData', data)
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
    //  user data update status field 
    static userUpdate = async (req, res) => {
        try {
            const { name, email, mobile, projectName, address, status } = req.body
            if (status != null) {
                const id = req.params.id;
                const data = await UserModel.findByIdAndUpdate({ _id: id }, {
                    name: name,
                    email: email,
                    mobile: mobile,
                    projectname: projectName,
                    address: address,
                    status: status

                })
                await data.save()
                res.status(200).json({
                    message: "data updated successfuly !"
                })
            } else {
                res.status(200).json({
                    message: "check your field ! "
                })
            }

        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Inetrnal server error ! "
            })
        }
    }
    // user data
    // Delete the user data 
    static userdataDelete = async (req, res) => {
        try {
            const id = req.params.id;
            const data = await UserModel.findByIdAndDelete({ _id: id })
            res.status(204).json({
                message: "user ! ",
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
}
module.exports = projectController
