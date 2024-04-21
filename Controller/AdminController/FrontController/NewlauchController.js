const newlaunchModel = require('../../../models/newlaunch/newProject');
const nodemailer = require("nodemailer");
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


                    const data = new prelaunchModel({
                        floorPlan: {
                          public_id:floorPlanresult.public_id,
                          url:floorPlanResult.secure_url
                        },
                        sitePlan: {
                           public_id:siteResult.public_id,
                           url:siteResult.secure_url
                        },
                        locationMap: {
                       public_id:locationResult.public_id,
                       url:locationResult.secure_url
                        },
                        projectName: projectName,
                       minPrice:minPrice,
                       maxPrice:maxPrice,
                       developerName:developerName,
                       bedroom:bedroom,
                       address:address,
                       block:block,
                       floor:floor,
                       carparkSpace:carparkSpace,
                       nearestLandmark:nearestLandmark,
                       facility:facility,
                       unit:unit,
                       launch:launch,
                       area:area,
                       aboutProject:aboutProject
                      
                    })
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
    try{
        const projectName=req.params.projectName
      const data=await preLaunch_bhkview.find({projectName:projectName})
    }catch(error){
        console.log(error)
        res.status()
    }
    }
    static newlaunch_viewAll = async (req, res) => {
        try {
            const data = await newlaunchModel.find()
            res.status(200).json({
                message:"All data get successfull !! "
                ,data
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Internal server error ! "
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
            res.status(500).json({
                message: "Internal server error ! "
            })
        }
    }
    static newlaunch_update = async (req, res) => {
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
    
    static pahleGhar=async(req,res)=>{
        try {
            const {salutation,name,surname,email,dob,pan,contact,city,state,address,pincode,ofContact,floor,area,unit,paymentPlan } = req.body;
           
            // const ema=email
     
              // await sendPostEmail(email,number,projectName)
              const transporter = await nodemailer.createTransport({
                service: "gmail",
                port: 465,
                secure: true,
                logger: false,
                debug: true,
                secureConnection: false,
                auth: {
                  // user: process.env.Email,
                  // pass: process.env.EmailPass
                  user: "web.100acress@gmail.com",
                  pass: "txww gexw wwpy vvda",
                },
                tls: {
                  rejectUnAuthorized: true,
                },
              });
              // Send mail with defined transport objec
              let info = await transporter.sendMail({
                from: "query.aadharhomes@gail.com", // Sender address
                to: "query.aadharhomes@gail.com", // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
                subject: "100acress.com Enquiry",
                html: `
                          <!DOCTYPE html>
                          <html lang:"en>
                          <head>
                          <meta charset:"UTF-8">
                          <meta http-equiv="X-UA-Compatible"  content="IE=edge">
                          <meta name="viewport"  content="width=device-width, initial-scale=1.0">
                          <title>New Enquiry</title>
                          </head>
                          <body>
                              <h3>Project Enquiry</h3>
                              <p>Customer Name: ${salutation} ${name} ${surname}</p>
                              <p>Customer Email Id: ${email}</p>
                              <p>Date of Birth: ${dob}</p>
                              <p>PAN Number: ${pan}</p>
                              <p>Address: ${address}, ${city}, ${state} - ${pincode}</p>
                              <p>Contact Number: ${contact}</p>
                              <p>Alternate Contact Number: ${ofContact}</p>
                              <p>Floor: ${floor}</p>
                              <p>Area: ${area}</p>
                              <p>Unit: ${unit}</p>
                              <p>Thank you!</p>
                          </body>
                          </html>
                  `,
              });
      
          
              res.status(201).json({
                message:
                  "User data submitted successfully , and the data has been sent via email",
                // dataInsert: data
              });
            
          } catch (error) {
            console.log(error);
            res.status(500).json({
              message: "Internal server error ! ",
            });
          }
    }
    static Valley=async(req,res)=>{
        try {
            const { username, email, mobile } = req.body;
           
            // const ema=email
            if (mobile && username&&email) {
              // await sendPostEmail(email,number,projectName)
              const transporter = await nodemailer.createTransport({
                service: "gmail",
                port: 465,
                secure: true,
                logger: false,
                debug: true,
                secureConnection: false,
                auth: {
                  // user: process.env.Email,
                  // pass: process.env.EmailPass
                  user: "web.100acress@gmail.com",
                  pass: "txww gexw wwpy vvda",
                },
                tls: {
                  rejectUnAuthorized: true,
                },
              });
              // Send mail with defined transport objec
              let info = await transporter.sendMail({
                from: "amit100acre@gmail.com", // Sender address
                to: "amit100acre@gmail.com", // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
                subject: "100acress.com Enquiry",
                html: `
                          <!DOCTYPE html>
                          <html lang:"en>
                          <head>
                          <meta charset:"UTF-8">
                          <meta http-equiv="X-UA-Compatible"  content="IE=edge">
                          <meta name="viewport"  content="width=device-width, initial-scale=1.0">
                          <title>New Enquiry</title>
                          </head>
                          <body>
                              <h3>Project Enquiry</h3>
                              <p>Customer Name : ${username}</p>
                              <p>Customer Email Id : ${email}</p>
                              <p>Customer Mobile Number : ${mobile} </p>
                             
                              <p>Thank you!</p>
                          </body>
                          </html>
                  `,
              });
      
          
              res.status(201).json({
                message:
                  "User data submitted successfully , and the data has been sent via email",
                // dataInsert: data
              });
            } else {
              res.status(403).json({
                message: "not success",
              });
            }
          } catch (error) {
            console.log(error);
            res.status(500).json({
              message: "Internal server error ! ",
            });
          }
    }
}
module.exports = newlaunchController


