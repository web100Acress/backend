const rent_Model = require('../../../models/property/rent');

const cloudinary = require('cloudinary').v2;
class rentController {

 // Rent Property Insert Edit view delete
    //Insert
    static rentInsert = async (req, res) => {
        // res.send("listen rent insert !")
        try {
            // console.log("hello")
            const { projectName, propertyType, propertyName, price, area, availableDate, descripation,
                furnishing, builtYear, amenities, landmark, type, city, state, address } = req.body
            if (projectName && propertyType && propertyName && price && area && availableDate && descripation
                && furnishing && builtYear && amenities && landmark && type && city && state && address) {
                if (req.files.frontImage && req.files.otherImage) {
                    const frontImage=req.files.frontImage
                    const otherImage=req.files.otherImage
                    
                    const frontResult=await cloudinary.uploader.upload(frontImage.tempFilePath,{
                        folder: "100acre/Rental_Property"
                    })

                    const otherImageLink=[]

                    if(otherImage.length >=2){
                        for(let i=0 ; i<otherImage.length ; i++){
                            const otherResult= await cloudinary.uploader.upload(
                                otherImage[i].tempFilePath ,{
                                 folder:"100acre/Rental_Property"
                                }
                            );
                            otherImageLink.push({
                               public_id:otherResult.public_id,
                               url:otherResult.secure_url 
                            })
                        }
                    }else{
                       const otherResult=await cloudinary.uploader.upload(
                        otherImage.tempFilePath ,{
                            folder:"100acre/Rental_Property"
                        }
                       );
                       otherImageLink.push({
                        public_id:otherResult.public_id,
                        url:otherResult.secure_url
                       })

                    }
                const data= new rent_Model({
                    frontImage:{
                        public_id:frontResult.public_id,
                        url:frontResult.secure_url
                    },
                    otherImage:otherImageLink,
                    projectName:projectName,
                    propertyType:propertyType,
                    propertyName:propertyName,
                    price:price,
                    area:area,
                    availableDate:availableDate,
                    descripation:descripation,
                    furnishing:furnishing,
                    builtYear:builtYear,
                    amenities:amenities,
                    landmark:landmark,
                    type:type,
                    city:city,
                    state:state,
                    address:address

                })    
                     await data.save()
                     res.status(200).json({
                        message:"rental data insert successfully",
                        dataRent:data
                     })

                 } else {
                    res.status(403).json({
                        message:"check image field !"
                    })
                  }

            } else {
                res.status(403).json({
                    message: "check all field !"
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: "an error is occured",
            })
        }
    }
    //edit
    static rentEdit = async (req, res) => {
        // res.send("rent edit ")
        try {
            // console.log("edit")
            const id =req.params.id
            const data=await rent_Model.findById(id)
            res.status(200).json({
                message:"data get successfully !",
                dataEdit:data
            })
        } catch (error) {
           console.log(error)
           res.status(500).json({
            error:"something went wrong !"
           }) 
        }
    }
    //view
    static rentView = async (req, res) => {
        // res.send("listen  rent view ")
        try {
            // const id = req.params.id
            const type=req.params.type
            const data=await rent_Model.find({type:type})   
            res.status(200).json({
               message:"data get successfully !" ,
               dataView:data
            })    
        } catch (error) {
          res.status(500).json({
            message:"something went wrong !"
          })  
        }
    }
    // update
    static rentUpdate = async (req, res) => {
        res.send("listen rent  update ")
    }
    //delete
    static rentDelete = async (req, res) => {
       try {
        // console.log("hello")
        const image= await rent_Model.findById(req.params.id)
        const imageId=image.frontImage.public_id;

        await cloudinary.uploader.destroy(imageId)

         
        

       } catch (error) {
        console.log(error)
        res.status(500).json({
          error:"something went wrong !"  
        })
       }
    }

}
module.exports = rentController