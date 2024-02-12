const ProjectModel = require("../../../models/projectDetail/project");
const UserModel = require("../../../models/projectDetail/user");
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv').config()
const cache = require('memory-cache');



const sendPostEmail = async (email ,number,projectName) => {
    const transporter = await nodemailer.createTransport({
        service:'gmail',
        port:465,
        secure:true,
        logger:false,
        debug:true,
        secureConnection:false,
        auth: {
            // user: process.env.Email,
            // pass: process.env.EmailPass
            user:"web.100acress@gmail.com",
            pass:"txww gexw wwpy vvda"
        },
        tls:{
            rejectUnAuthorized:true
        }
    });
    // Send mail with defined transport objec
    let info = await transporter.sendMail({
        from: 'amit100acre@gmail.com', // Sender address
        to: 'query.aadharhomes@gmail.com', // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
        subject: 'Project Enquiry',
        html: `
        <!DOCTYPE html>
        <html lang:"en>
        <head>
        <meta charset:"UTF-8">
        <meta http-equiv="X-UA-Compatible"  content="IE=edge">
        <meta name="viewport"  content="width=device-width, initial-scale=1.0">
        <title>New Project Submission</title>
        </head>
        <body>
            <h1>New Lead</h1>
            <h3>A new Enquiry</h3>
            <p>Customer Email Id : ${email}</p>
            <p>Customer Mobile Number : ${number} </p>
            <p>ProjectName : ${projectName}</p>
            <p>Please review the details and take necessary actions.</p>
            <p>Thank you!</p>
        </body>
        </html>
`
    });

}
class projectController {

    static project = async (req, res) => {
        res.send("project")
    }
    // Project data insert api
    static projectInsert = async (req, res) => {
        // console.log("hello")
        try {
            // console.log(req.body)
            const { projectName,
                state,
                projectAddress,
                project_discripation,
                AboutDeveloper,
                builderName,
                projectRedefine_Connectivity,
                projectRedefine_Education,
                projectRedefine_Business,
                projectRedefine_Entertainment,
                Amenities,
                meta_title,
                meta_description,
                projectBgContent,
                projectReraNo,
                type,
                city,
                projectOverview,
                project_url
            } = req.body
            // console.log(req.body)
            // console.log(req.files)
            if(projectOverview){
            if (req.files) {
                if (req.files.logo && req.files.frontImage && req.files.project_locationImage && req.files.project_floorplan_Image) {
                    const logo = req.files.logo
                    const logoResult = await cloudinary.uploader.upload(
                        logo.tempFilePath, {
                        folder:"100acre/project"
                    }
                    )
                  
                    const frontImage = req.files.frontImage
                    const projectBgResult = await cloudinary.uploader.upload(
                        frontImage.tempFilePath, {
                        folder:"100acre/project"
                    }
                    )
                    const project_locationImage = req.files.project_locationImage;
                    const projectLocationResult = await cloudinary.uploader.upload(
                        project_locationImage.tempFilePath, {
                        folder:"100acre/project"
                    }
                    )

                    const project_floorplan = req.files.project_floorplan_Image;
                    // console.log(req.files.project_floorplan_Image)
                    const floorplanLink = []
                    if (project_floorplan.length>= 2) {
                        for(let i=0;i<project_floorplan.length;i++){
                            // console.log("h")
                            const project_floorplanResult=await cloudinary.uploader.upload(
                                project_floorplan[i].tempFilePath,{
                                    folder:"100acre/project"
                                }
                            );

                            floorplanLink.push({
                                public_id: project_floorplanResult.public_id,
                                url: project_floorplanResult.secure_url
                            })
                        }

                    } else {
                        const project_floorplanResult = await cloudinary.uploader.upload(
                            project_floorplan.tempFilePath, {
                            folder:"100acre/project"
                        }
                        )
                        floorplanLink.push({
                            public_id: project_floorplanResult.public_id,
                            url: project_floorplanResult.secure_url
                        })

                    }

                    const data = new ProjectModel({
                        logo: {
                            public_id: logoResult.public_id,
                            url: logoResult.secure_url
                        },
                        frontImage: {
                            public_id: projectBgResult.public_id,
                            url: projectBgResult.secure_url
                        },

                        project_locationImage: {
                            public_id: projectLocationResult.public_id,
                            url: projectLocationResult.secure_url
                        },

                        project_floorplan_Image: floorplanLink,
                        projectName: projectName,
                        state: state,
                        project_discripation: project_discripation,
                        AboutDeveloper: AboutDeveloper,
                        builderName: builderName,
                        projectAddress: projectAddress,
                        projectRedefine_Connectivity: projectRedefine_Connectivity,
                        projectRedefine_Education: projectRedefine_Education,
                        projectRedefine_Business: projectRedefine_Business,
                        projectRedefine_Entertainment: projectRedefine_Entertainment,
                        Amenities: Amenities,
                        meta_title: meta_title,
                        meta_description: meta_description,
                        projectBgContent: projectBgContent,
                        projectReraNo: projectReraNo,
                        type: type,
                        city: city,
                        projectOverview:projectOverview,
                        project_url:project_url

                    })
                    // console.log(data)
                    await data.save()
                    res.status(200).json({
                        message: "data inserted successfully ! "
                    })

                } else {
                    res.status(403).json({
                        message: "Check Image field ! "
                    })
                }
            } else {
                res.status(403).json({
                    message: "check input field ! "
                })
            }
        }else{
            res.status(403).json({
                message: "projectOverview null ! "
            })
        }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error !"
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
    // see project by name view details 
    static projectView = async (req, res) => {
        // console.log("hello")
        try {
            const project_url = req.params.project_url
            if(project_url){
            const data = await ProjectModel.find({project_url:project_url})
            res.status(200).json({
                message: " enable",
                dataview: data
            })
        }else{
            res.status(200).json({
                message:"Internal server error ! "
            })
        }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: "an error is occured",
            })
        }
    }
    static projectUpdate = async (req, res) => {
        try {
            // console.log("hello")
            const {
                projectName,
                state,
                project_discripation,
                projectAddress,
                builderName,
                AboutDeveloper,
                projectRedefine_Business,
                projectRedefine_Connectivity,
                projectRedefine_Education,
                projectRedefine_Entertainment,
                Amenities,
                projectBgContent,
                projectReraNo,
                meta_description,
                meta_title,
                type,
                city,
              projectOverview,
              project_url
            } = req.body
            const id = req.params.id;
            if (req.files) {
                // console.log("hellofile")
                if (req.files.logo && req.files.frontImage && req.files.project_locationImage && req.files.project_floorplan_Image) {
                    // console.log("hello")
                    const logo = req.files.logo;
                    // console.log("hello")
                    const logoResult = await cloudinary.uploader.upload(
                        logo.tempFilePath, {
                        folder: "100acre/project"
                    }
                    )
                  
                    const frontImage = req.files.frontImage;
                    const projectBgResult = await cloudinary.uploader.upload(
                        frontImage.tempFilePath, {
                        folder:"100acre/project"
                    }
                    )
                  
                    const project_locationImage = req.files.project_locationImage;
                    const projectlocationResult = await cloudinary.uploader.upload(
                        project_locationImage.tempFilePath, {
                        folder: "100acre/project"
                    }
                    )
                   
                    const project_floorplan_Image = req.files.project_floorplan_Image;
                    const floorplanLink = []
               
                    if (project_floorplan_Image.length >= 2) {

                        for (let i = 0; i < project_floorplan_Image.length; i++) {
                            const project_floorplanResult = await cloudinary.uploader.upload(
                                project_floorplan_Image[i].tempFilePath, {
                                folder: "100acre/project"
                            }
                            )
                           
                            floorplanLink.push({
                                public_id: project_floorplanResult.public_id,
                                url: project_floorplanResult.secure_url
                            })
                        }
                    } else {
                        const project_floorplanResult = await cloudinary.uploader.upload(
                            project_floorplan_Image.tempFilePath, {
                            folder: "100acre/project"
                        }
                        )
                        floorplanLink.push({
                            public_id: project_floorplanResult.public_id,
                            url: project_floorplanResult.secure_url
                        })
                    }
                 
                    const data = await ProjectModel.findByIdAndUpdate({ _id: id }, {
                        logo: {
                            public_id: logoResult.public_id,
                            url: logoResult.secure_url
                        },
                        frontImage: {
                            public_id: projectBgResult.public_id,
                            url: projectBgResult.secure_url
                        },
                        project_locationImage: {
                            public_id: projectlocationResult.public_id,
                            url: projectlocationResult.secure_url
                        },
                        project_floorplan_Image: floorplanLink,
                        projectName: projectName,
                        state: state,
                        project_discripation: project_discripation,
                        projectAddress: projectAddress,
                        AboutDeveloper: AboutDeveloper,
                        builderName: builderName,
                        projectRedefine_Business: projectRedefine_Business,
                        projectRedefine_Connectivity: projectRedefine_Connectivity,
                        projectRedefine_Education: projectRedefine_Education,
                        projectRedefine_Entertainment: projectRedefine_Entertainment,
                        Amenities: Amenities,
                        projectBgContent: projectBgContent,
                        projectReraNo: projectReraNo,
                        meta_title: meta_title,
                        meta_description: meta_description,
                        type: type,
                        city: city,
                        projectOverview: projectOverview,
                        project_url:project_url

                    })
                    // console.log(data)
                    await data.save()
                    res.status(200).json({
                        message: 'data updated successfully ! '
                    })
                } else if (req.files.logo) {
                    console.log("logo")
                    const logo = req.files.logo;
                    // console.log("hello")
                    const logoResult = await cloudinary.uploader.upload(
                        logo.tempFilePath, {
                        folder: "100acre/project"
                    }
                    )



                    const data = await ProjectModel.findByIdAndUpdate({ _id: id }, {
                        logo: {
                            public_id: logoResult.public_id,
                            url: logoResult.secure_url
                        },

                        projectName: projectName,
                        state: state,
                        project_discripation: project_discripation,
                        projectAddress: projectAddress,
                        AboutDeveloper: AboutDeveloper,
                        builderName: builderName,
                        projectRedefine_Business: projectRedefine_Business,
                        projectRedefine_Connectivity: projectRedefine_Connectivity,
                        projectRedefine_Education: projectRedefine_Education,
                        projectRedefine_Entertainment: projectRedefine_Entertainment,
                        Amenities: Amenities,
                        projectBgContent: projectBgContent,
                        projectReraNo: projectReraNo,
                        meta_title: meta_title,
                        meta_description: meta_description
                        , projectOverview: projectOverview,
                        project_url:project_url
                    })
                    // console.log(data)
                    await data.save()
                    res.status(200).json({
                        message: "data updated successfully ! "
                    })
                } else if (req.files.frontImage) {

                    // console.log("helo project")
                    const frontImage = req.files.frontImage;
                    const projectBgResult = await cloudinary.uploader.upload(
                        frontImage.tempFilePath, {
                        folder:"100acre/project"
                    }
                    )
                    const data = await ProjectModel.findByIdAndUpdate({ _id: id }, {
                        frontImage: {
                            public_id: projectBgResult.public_id,
                            url: projectBgResult.secure_url
                        },
                        projectName: projectName,
                        state: state,
                        project_discripation: project_discripation,
                        projectAddress: projectAddress,
                        bulderName: builderName,
                        AboutDeveloper: AboutDeveloper,
                        projectRedefine_Business: projectRedefine_Business,
                        projectRedefine_Education: projectRedefine_Education,
                        projectRedefine_Connectivity: projectRedefine_Connectivity,
                        projectRedefine_Entertainment: projectRedefine_Entertainment,
                        Amenities: Amenities,
                        projectBgResult: projectBgResult,
                        projectReraNo: projectReraNo,
                        meta_description: meta_description,
                        meta_title: meta_title,
                        type: type,
                        city: city,
                        projectOverview: projectOverview,
                        project_url:project_url
                    })
                    // console.log(data)
                    await data.save()
                    res.status(200).json({
                        message: "data updated successfully !"
                    })
                } else if (req.files.project_locationImage) {
                    const projectLocation = req.files.project_locationImage;
                    const projectLocationResult = await cloudinary.uploader.upload(
                        projectLocation.tempFilePath, {
                        folder:"100acre/project"
                    }
                    )
                    const data = await ProjectModel.findByIdAndUpdate({ _id: id }, {
                        project_locationImage: {
                            public_id: projectLocationResult.public_id,
                            url: projectLocationResult.secure_url
                        },
                        projectName: projectName,
                        state: state,
                        projectAddress: projectAddress,
                        builderName: builderName,
                        AboutDeveloper: AboutDeveloper,
                        project_discripation: project_discripation,
                        projectRedefine_Business: projectRedefine_Business,
                        projectRedefine_Connectivity: projectRedefine_Connectivity,
                        projectRedefine_Education: projectRedefine_Education,
                        projectRedefine_Entertainment: projectRedefine_Entertainment,
                        Amenities: Amenities,
                        projectBgContent: projectBgContent,
                        projectReraNo: projectReraNo,
                        meta_description: meta_description,
                        meta_title: meta_title,
                        city: city,
                        type: type,
                        projectOverview: projectOverview,
                        project_url:project_url
                    })
                    //  console.log(data)
                    await data.save()
                    res.status(200).json({
                        message: "data updated successfully ! ",
                        data
                    })
                } else if (req.files.project_floorplan_Image) {
                    const project_floorplan_Image = req.files.project_floorplan_Image;
                    // console.log(project_floorplan_Image)
                    const floorplanLink = []
                    if (project_floorplan_Image.length >= 2) {

                        for (let i = 0; i < project_floorplan_Image.length; i++) {
                            const project_floorplanResult = await cloudinary.uploader.upload(
                                project_floorplan_Image[i].tempFilePath, {
                                folder:"100acre/project"
                            }
                            )
                           
                            floorplanLink.push({
                                public_id: project_floorplanResult.public_id,
                                url: project_floorplanResult.secure_url
                            })
                        }
                    } else {
                        const project_floorplanResult = await cloudinary.uploader.upload(
                            project_floorplan_Image.tempFilePath, {
                            folder: "100acre/project"
                        }
                        )
                        floorplanLink.push({
                            public_id: project_floorplanResult.public_id,
                            url: project_floorplanResult.secure_url
                        })
                    }

                    const data = await ProjectModel.findByIdAndUpdate({ _id: id }, {
                        project_floorplan_Image: floorplanLink,
                        projectName: projectName,
                        state: state,
                        projectAddress: projectAddress,
                        project_discripation: project_discripation,
                        projectRedefine_Business: projectRedefine_Business,
                        projectRedefine_Connectivity: projectRedefine_Connectivity,
                        projectRedefine_Entertainment: projectRedefine_Entertainment,
                        projectRedefine_Education: projectRedefine_Education,
                        Amenities: Amenities,
                        projectBgContent: projectBgContent,
                        projectReraNo: projectReraNo,
                        meta_description: meta_description,
                        meta_title: meta_title,
                        city: city,
                        type: type,
                        projectOverview: projectOverview,
                        project_url:project_url
                    })
                    await data.save()
                    res.status(200).json({
                        message: "data updated successfully ! "
                    })
                }
            } else {
                const data = await ProjectModel.findByIdAndUpdate({ _id: id }, {
                    projectName: projectName,
                    state: state,
                    projectAddress: projectAddress,
                    project_discripation: project_discripation,
                    projectRedefine_Business: projectRedefine_Business,
                    projectRedefine_Connectivity: projectRedefine_Connectivity,
                    projectRedefine_Entertainment: projectRedefine_Entertainment,
                    projectRedefine_Education: projectRedefine_Education,
                    Amenities: Amenities,
                    projectBgContent: projectBgContent,
                    projectReraNo: projectReraNo,
                    meta_description: meta_description,
                    meta_title: meta_title,
                    city: city,
                    type: type,
                    projectOverview: projectOverview,
                    project_url:project_url
                })
                await data.save()
                res.status(200).json({
                    message: "data updated successfully ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error !"
            })
        }
    }
    //findAll
    static projectviewAll = async (req, res) => {

        try {
            const data = await ProjectModel.find()
       if(data){
            res.status(200).json({
                message: "All project Data get  !",
                data
            })
        }else{
            res.status(200).json({
                message: "data not found  !",
               
            })  
        }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error ! "
            })
        }
    }

// Route handler to get all project data
// static projectviewAll = async (req, res) => {
//     try {
//         const cachedData = cache.get('allProjects');
//         if (cachedData) {
//             return res.status(200).json({
//                 message: "Data fetched from cache!",
//                 data: cachedData
//             });
//         } else {
//             // If data is not cached, fetch it and cache it
//             await getAllProjects();
//             const newData = cache.get('allProjects');
//             return res.status(200).json({
//                 message: "Data fetched and cached!",
//                 data: newData
//             });
//         }
//     } catch (error) {
//         console.error("Error fetching projects:", error);
//         res.status(500).json({
//             message: "Internal server error!"
//         });
//     }
// }; 
    //  project data delete 
    static projectDelete = async (req, res) => {
        // console.log("helo")
        try {
            const id = req.params.id
        
            const data = await ProjectModel.findByIdAndDelete({ _id: id })
            res.status(202).json({
                message: 'data deleted sucessfully!',
                // deletedata: data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "internal server error !"
            })
        }
    }
    //project find trending data
   static project_trending=async(req,res)=>{
    // console.log("hello")
    try {
        const data =await ProjectModel.find({projectOverview:"trending"})
        res.status(200).json({
            message:"data get successfully !",
            data
        })
    } catch (error) {
     console.log(error) 
     res.status(500).json({
        message:"internal server error ! "
     })  
    }
   }
   // project find featured data 
    static project_featured=async(req,res)=>{
    // console.log("hello")
    try {
      
        const data =await ProjectModel.find({projectOverview:"featured"}).limit(4)
        res.status(200).json({
            message:"data get successfully !",
            data
        })
    } catch (error) {
     console.log(error) 
     res.status(500).json({
        message:"internal server error ! "
     })  
    }
   }
    // project Bhk detail inter data
    static bhk_insert = async (req, res) => {
        try {
            // console.log("hello")
            if (req.body) {
                const id = req.params.id
                if (id) {
                    const { bhk_type, price, bhk_Area } = req.body
                    if (bhk_type && price && bhk_Area) {
                        const data = {
                            bhk_type: bhk_type,
                            price: price,
                            bhk_Area: bhk_Area
                        }
                        const dataPushed = await ProjectModel.findOneAndUpdate(
                            { _id: id },
                            { $push: { BhK_Details: data } },
                            { new: true }
                        )
                        
                        await dataPushed.save()
                      
                        res.status(200).json({
                            message: "data pushed successfully !"
                        })
                    } else {
                        res.status(403).json({
                            message: "check your input field ! "
                        })
                    }
                } else {
                    res.status(403).json({
                        message: "check id !"
                    })
                }
            } else {
                res.status(403).json({
                    message: "check your field ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Inetrnal server error !"
            })
        }
    }
    // project bhk detail view 
    static bhk_view=async(req,res)=>{
    try{
    //console.log("chcoSJ")
    const id=req.params.id
    // console.log(id)
    if(id){
    const data=await ProjectModel.findById({_id:id})
    // console.log(data)
   if(data){
    res.status(200).json({
        message:"data get successfully",
        data:data.BhK_Details
    })
   }else{
    res.status(200).json({
        message:"data not found "
    })
   }
   
   }else{
   res.status(404).json({
    message:"check url id "
   })
  }
   
    }catch(error){
     console.log(error)
    }
        
    } 
    
   //project bhk edit data get
    static bhk_edit=async(req,res)=>{
        // console.log("hello")
        try {
            const id =req.params.id
            if(id){
              const data=await ProjectModel.findOne(  {"BhK_Details._id":id},
              {
                 BhK_Details:{
                     $elemMatch:{
                         _id:id
                     }
                 }
              })
              if(data){
                  res.status(200).json({
                    message:"data get successfully !",
                    data
                  })
              }else{
                res.status(200).json({
                    message:"data not found !"
                })
              }
            }else{
                res.status(404).json({
                    message:"check your id !"
                })
            }
        } catch (error) {
           console.log(error)
           res.status(500).json({
            message:"Internal server error ! "
           }) 
        }
    }
    //project bhk update 
    static bhk_update=async(req,res)=>{
        // console.log("hello")
        try {
            const{bhk_type,price,bhk_Area}=req.body
            const id=req.params.id
            const update={
                bhk_type: bhk_type,
                price: price,
                bhk_Area: bhk_Area
            }
            if(update){
            const data=await ProjectModel.findOneAndUpdate(
                {"BhK_Details._id":id},
                { $set: { "BhK_Details.$": update } }
            )
            if(data){
                res.status(200).json({
                    message:"data update successfully  !"
                })
            }else{
                res.status(200).json({
                    message:"data not found !"
                })
            }
        }else{
            res.status(200).json({
                message:"check field !"
            })
        }
            
        } catch (error) {
           console.log(error)
           res.status(500).json({
            message:"Internal server error ! "
           }) 
        }
    }
    // project bhk delete 
    // static bhk_delete=async(req,res)=>{
    //     // console.log("kas")
    //     try {
    //         const id=req.params.id
    //         if(id){
    //         const update = {
    //             $pull: {
    //                 BhK_Details: { _id: id }
    //             }
    //         };
    //         console.log(update,"hiuid")
    //          if(update){
    //         const data= await ProjectModel.updateOne({},update, { new: true })
    //         res.status(200).json({
    //             message:"delete successfully  !"
    //         })
    //          }else{
    //             res.status(200).json({
    //                 message:"not found in database !"
    //             }) 
    //          }

    //     }else{  res.status(404).json({
    //         message:"check id  !"
    //     })}
            
    //     } catch (error) {
    //         console.log(error)
    //         res.status(500).json({
    //             message:"internal server error !"
    //         })
    //     }
    // }
    static bhk_delete = async (req, res) => {
        try {
            const id = req.params.id;
            if (id) {
                const update = {
                    $pull: {
                        BhK_Details: { _id: id }
                    }
                };
            // console.log(id)
                const data = await ProjectModel.updateOne(update)
                    res.status(200).json({
                        message: "Delete successful!",
                        data
                    });
            } else {
                res.status(400).json({
                    message: "Invalid ID!"
                });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Internal server error!"
            });
        }
    }
    
    //Enquiry for the project page 
    static userInsert = async (req, res) => {
        // console.log("helo")
        // const data =new UserModel
        try {
            const { name,email, mobile, projectName, address } = req.body
            const ema=email
        // const ema=email
            if ( mobile && projectName && address) {
                const data = new UserModel({
                    name: name,
                    email:ema,
                    mobile: mobile,
                    projectName: projectName,
                    address: address
                })
                const email = data.email
                const number = data.mobile
                const projectName=data.projectName
                await sendPostEmail(email,number,projectName)
           
                await data.save()
                res.status(201).json({
                    message: "User data submitted successfully , and the data has been sent via email",
                    // dataInsert: data
                })
            } else {
                res.status(403).json({
                    message: "not success"
                })
            }
        } catch (error) {
           console.log(error)
           res.status(500).json({
            message:"Internal server error ! "
           })
        }
    }
    // Enquiry viewAll
    static userViewAll = async (req, res) => {
        // console.log("hello")
        try {
            // console.log("hellcadco")

            const data = await UserModel.find()
            if (data) {
                res.status(200).json({
                    message: "data get successfully !",
                    data: data
                })
            } else {
                res.status(200).json({
                    message: "data not found ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    // Enquiry user detail view 
    static userViewDetail = async (req, res) => {
        // console.log("hello")
        try {
            // console.log("hello")
            const id = req.params.id;
            if (id) {
                const data = await UserModel.findById({ _id: id })
                if (data) {
                    res.status(200).json({
                        message: "Data get successfully ! ",
                        data: data
                    })
                } else {
                    res.status(200).json({
                        message: "data not found ! "
                    })
                }
            } else {

            }
        } catch (error) {

        }
    }
    // Enquiry update 
    static userUpdate = async (req, res) => {
        // 
        try {
            // console.log("hello")
            // console.log(req.body)
            const id = req.params.id
            const { name, email, mobile, projectName, address, status } = req.body

            if (id) {
                if (status) {
                    const data = await UserModel.findByIdAndUpdate({ _id: id }, {
                        name: name,
                        email: email,
                        mobile: mobile,
                        projectName: projectName,
                        address: address,
                        status: status
                    })
                    // console.log(data)
                    await data.save()
                } else {
                    // console.log("hello ")
                    res.status(403).json({
                        message: "Check status field ! "
                    })

                }

            } else {
                res.status(403).json({
                    message: "please mtach id  ! "
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    // user data
    static userdataDelete = async (req, res) => {
        // console.log('hello delete')

        try {
            const id = req.params.id;
            const data = await UserModel.findByIdAndDelete({ _id: id })

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



  // const data=await ProjectModel.findOne()
        // const query = { city:"delhi" };

        //     const countCanada = await ProjectModel. countDocuments(query);
        //     console.log(countCanada)

    //     const fieldName = "city";
    //     // specify an optional query document
    //     const query = {  builderName:"Adani" };
        
    // const distinctValues = await ProjectModel.distinct(fieldName, query);
    // console.log(distinctValues);
    // const filter = {
    //     meta_title:
    //     "fwfw"};
    // // increment every document matching the filter with 2 more comments
    // const updateDoc = {
    //   $set: {
    //     meta_title: `After viewing I am ${
    //       100 * Math.random()
    //     }% more satisfied with life.`,
    //   },
    // };
    // const result = await ProjectModel.updateMany(filter, updateDoc);
    // console.log(`Updated ${result.modifiedCount} documents`);
            