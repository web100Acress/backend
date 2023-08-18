const buyCommercial_Model = require('../../../models/property/buyCommercial');
const cloudinary = require('cloudinary').v2;

class BuyController{
// Buy Commercial Insert
    static buycommercialInsert=async(req,res)=>{

    try {
        const{projectName,propertyTitle,price,state,city,address,type,descripation,amenities}=req.body


        if(projectName&&propertyTitle&&price&&state&&city&&address&&type&&descripation&&amenities&&req.files){
                if(req.files.frontImage&&req.files.otherImage){
                    const front=req.files.frontImage;
                    const other=req.files.otherImage
            
                   const otherImageLink=[]
                   console.log(otherImageLink)
                    const imageResult = await cloudinary.uploader.upload(
                        front.tempFilePath, {
                        folder: "100acre/BuyCommercial"
                    }
              
                    )
                    // console.log(imageResult)
                    for(let i=0 ; i< other.length ; i++){
                        const otherResult = await cloudinary.uploader.upload(
                            other[i].tempFilePath, {
                            folder: "100acre/BuyCommercial"
                        }
                        );
                        otherImageLink.push({
                            public_id:otherResult.public_id,
                            url:otherResult.secure_url
                        })
                    }
                    const data=new  buyCommercial_Model({
                        frontImage:{
                            public_id:imageResult.public_id,
                            url:imageResult.secure_url
                        },
                        otherImage:otherImageLink,
                        projectName:projectName,
                        propertyTitle:propertyTitle,
                        price:price,
                        state:state,
                        city:city,
                        address:address,
                        descripation:descripation,
                        amenities:amenities,
                        type:type
    
                    })
                    // console.log(data)
                    await data.save()
                    res.status(201).json({
                        message:"done",
                        dataget:data
                    })
                }else{
                    res.status(403).json({
                        message: "insert not  done",
                        
        
                    })  
                }
          

        }else{
            res.status(403).json({
                message: " not  done",
                

            })
        }
    } catch (error) {
     console.log(error)   
    }

    }

    static buycommercialView=async(req,res)=>{
        try {
            const projectName=req.params.projectName
            const data= await buyCommercial_Model.find({projectName:projectName})
            res.status(201).json({
                message: "view enable",
                dataview: data
            })

        } catch (error) {
          console.log(error)  
          res.status(500).json({
            error:"an error is occured",
          })
        }
    }

    static buycommercialEdit=async(req,res)=>{
        res.send("listen edit")
    }

    static buycommercialUpdate=async(req,res)=>{
        res.send("listen update")
    }
 
    static buycommercialDelete=async(req,res)=>{
        res.send("hey completed")
    }
}
module.exports=BuyController