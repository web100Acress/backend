//contact controller for handling opertion related contact page 
const cloudinary = require('cloudinary').v2;
// contac page   models
const contactModel = require("../../../models/contact")
const contactbannerModel = require("../../../models/contactbanner")
const contactPagedetailModel = require("../../../models/contactdetail")


class contactController {

    static contact=async(req,res)=>{
        res.send('contact page controlller api listen')
    }
    // contact page banner work
    // insert
    static contactbanner_insert = async (req, res) => {
        // console.log("helo")
        try {
            const { heading, descripation } = req.body
            if (heading && descripation && req.files) {
                const image = req.files.contact_banner;
                const imageResult = await cloudinary.uploader.upload(
                    image.tempFilePath, {
                    folder: "100acre/ContactbannerImage"
                }
                );

                const data = new contactbannerModel({
                    contact_banner: {
                        public_id: imageResult.public_id,
                        url: imageResult.secure_url
                    },
                    heading: heading,
                    descripation: descripation
                })

                await data.save()
                res.status(201).json({
                    message: "insert done",
                    datainsert: data
                })

            } else {
                res.status(403).json({
                    message: "insert not  done"

                })
            }
        } catch (error) {
            console.log(error)
        }
    }
    //edit
    static contactbanner_edit = async (req, res) => {
        // console.log("hello")
        try {
            const data = await contactbannerModel.findById(req.params.id)
            //    await data.save()
            res.status(201).json({
                message: "editing enable",
                dataedit: data
            })
        } catch (error) {
            console.log(error)
        }
    }
    //view
    static contactbanner_view=async(req,res)=>{
        try {
            const data = await contactbannerModel.findById(req.params.id)
            //    await data.save()
            res.status(201).json({
                message: "view enable",
                dataedit: data
            })
        } catch (error) {
            console.log(error)
        }
    }
    // update
    static contactbanner_update=async(req,res)=>{
       try {
        const{heading,descripation}=req.body
        if(heading&&descripation){
            if(req.files){
                const image=req.files.contact_banner;
                // console.log(image)
                 const data=await contactbannerModel.findById(req.params.id);
                //  console.log(data)
                 const imgaeid=data.contact_banner.public_id;
                 await cloudinary.uploader.destroy(imgaeid)
               
                 const imageResult= await cloudinary.uploader.upload( image.tempFilePath ,{
                    folder:"100acre/ContactbannerImage"
                 })
                 const updatedata=await contactbannerModel.findByIdAndUpdate(req.params.id,{
                    contact_banner: {
                        public_id: imageResult.public_id,
                        url: imageResult.secure_url
                                   },
                    heading: heading,
                    descripation: descripation
                 })
                //  console.log(updatedata)
                await updatedata.save()
                res.status(201).json({
                    message:"update",
                    data:updatedata
                })
            }else{
              const updatedata=await contactbannerModel.findByIdAndUpdate(req.params.id,{
                heading: heading,
                descripation: descripation
              })
            console.log(updatedata)
          await updatedata.save()
          res.status(201).json({
            message:'updated:',
            data:updatedata
          })

            }
        
        }else{

        }
       } catch (error) {
        
       }
    }

    // contact customer section page form
    // method for inserting custmer detail 
    static contact_Insert = async (req, res) => {
        //  console.log("hello post ")
        // console.log(req.body)
        try {
            const { name, email, mobile, message } = req.body
            if (name && email && mobile && message) {
                const userData = new contactModel({
                    name: name,
                    email: email,
                    mobile: mobile,
                    message: message
                })

                // console.log(userData)
                await userData.save()
                res.status(201).json({
                    message: "your message send ! Contact u later",
                    data: userData
                })
            } else {
                res.status(403).json({
                    message: "can not empty",

                })
            }
        } catch (error) {
            console.log(error)
        }
    }
    // method for view the customer detail
    static contact_view = async (req, res) => {
        // console.log('hello')
        try {
            const data = await contactModel.findById(req.params.id)

            res.status(201).json({
                message: "data get sucessfully",
                dataview: data
            })

        } catch (error) {
            console.log(error)
        }
    }
    // method for delete the customer detail
    static contact_delete = async (req, res) => {
        // console.log('helllo  delete customer details')

        try {
            const data = await contactModel.findByIdAndDelete(req.params.id)
            res.status(201).json({
                message: 'data deleted sucessfully!',
                dataDelete:data
            })
        } catch (error) {
            console.log(error)
        }
    }
//  contact page companyt detail
    //contact page detail insert api
    static contact_pagedetail = async (req, res) => {
        // console.log('helllo  ')
        try {
            const { companyName, contactNumber, telephonenumber, email, address, descripation } = req.body
            if (companyName && contactNumber && telephonenumber && email && address && descripation) {
                const data = new contactPagedetailModel({
                    companyName: companyName,
                    contactNumber: contactNumber,
                    telephonenumber: telephonenumber,
                    email: email,
                    address: address,
                    descripation: descripation
                })
                // console.log(data)
                await data.save()
                res.status(201).json({

                    message: "detail posted!",
                    detail: data
                })
            } else {
                res.status(403).json({
                    message: "check all field",
                })
            }

        } catch (error) {
            console.log(error)
        }
    }

    static contact_pagedetail_edit = async (req, res) => {
        // console.log('helo')
        try {
            const data = await contactPagedetailModel.findById(req.params.id)
            res.status(201).json({
                message: "editing is enable",
                dataedit: data
            })

        } catch (error) {
            console.log(error)
        }
    }
    
     //view
     static contact_pagedetail_view=async(req,res)=>{
        try {
            const data = await contactPagedetailModel.findById(req.params.id)
            res.status(201).json({
                message: "view is enable",
                dataview: data
            })

        } catch (error) {
            console.log(error)
        }
     }
    static contact_pagedetail_update = async (req, res) => {
        try {
            const id = req.params.id;
            const data = await contactPagedetailModel.findByIdAndUpdate(id, {
                companyName: req.body.companyName,
                contactNumber: req.body.contactNumber,
                telephonenumber: req.body.telephonenumber,
                email: req.body.email,
                address: req.body.address,
                descripation: req.body.descripation
            })
            await data.save(data)
            res.status(201).json({
                message: "updated!",
                dataUpdated: data
            })
            console.log("helo")

        } catch (error) {

        }
    }

}
module.exports = contactController