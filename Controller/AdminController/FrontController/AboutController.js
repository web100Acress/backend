const aboutModel = require('../../../models/about/about');
const rent_Model = require('../../../models/property/rent');

const cloudinary = require('cloudinary').v2;
class aboutController{

static about=async(req,res)=>{
res.send("about page listent")
}

static aboutInsert=async(req,res)=>{
    try {
        const{sliderHeading,sliderDescripation,aboutHeading,aboutDescripation,chooseHeading,chooseDescripation}=req.body
        if(sliderHeading && sliderDescripation && aboutHeading && aboutDescripation && chooseHeading  && chooseDescripation){
            if(req.files.sliderImage && req.files.aboutImage && req.files.chooseImage){
              const sliderImage=req.files.sliderImage;
              const aboutImage=req.files.aboutImage;
              const chooseImage=req.files.chooseImage

              const sliderResult=await cloudinary.uploader.upload(sliderImage.tempFilePath ,{
                folder:"100acre/aboutPage"
              })
              const aboutResult=await cloudinary.uploader.upload(aboutImage.tempFilePath ,{
                folder:"100acre/aboutPage"
              })
              const chooseResult=await cloudinary.uploader.upload(chooseImage.tempFilePath ,{
                folder:"100acre/aboutPage"
              })

              const data=new aboutModel({
                sliderImage:{
                   public_id:sliderResult.public_id,
                   url:sliderResult.secure_url
                },
                aboutImage:{
                    public_id:aboutResult.public_id,
                    url:aboutResult.secure_url
                },
                chooseImage:{
                    public_id:chooseResult.public_id,
                    url:chooseResult.secure_url
                },

                sliderHeading:sliderHeading,
                sliderDescripation:sliderDescripation,
                aboutHeading:aboutHeading,
                aboutDescripation:aboutDescripation,
                chooseHeading:chooseHeading,
                chooseDescripation:chooseDescripation
              })
            //   console.log(data)
            await data.save()
            res.status(200).json({
                message:"data insert successfully !"
            })

            }else{
                res.status(500).json({
                    message:"something went wrong !",
                })
            }
        }else{
           res.status(500).json({
            message:"something went wrong ! "
           })}
        
        
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message:"somthing went wrong !",
            error
        })
        
    }
}

static aboutView=async(req,res)=>{
    // res.send("hello")
    try {
        const id=req.params.id;
        const data=await aboutModel.findById(id)
        res.status(200).json({
            message:"data get succefully !",
            data
        })
        
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message:"something went wrong ! "
        })
    }
}

static aboutEdit=async(req,res)=>{
    // res.send("hello edit")
    try {
        const id = req.params.id;
        const data=await aboutModel.findById(id)
        res.status(200).json({
            message :"data edit !",
            data
        })
        
    } catch (error) {
       console.log(error)
       res.status(500).json({
        message:"something went wrong !",
       }) 
    }
}
static aboutUpdate=async(req,res)=>{
    // res.send("hello update")
    try {
        const{sliderHeading,sliderDescripation,aboutHeading,aboutDescripation,chooseHeading,chooseDescripation}=req.body
        if(sliderHeading&&sliderDescripation&&aboutHeading&&aboutDescripation&&chooseDescripation&&chooseHeading){
           if(req.files){
            if(req.files.sliderImage && req.files.aboutImage && req.files.chooseImage){
                
                const sliderImage=req.files.sliderImage;
                const aboutImage=req.files.aboutImage;
                const chooseImage=req.files.chooseImage;

                const data=await aboutModel.findById(req.params.id)

                const sliderId=data.sliderImage.public_id
                await cloudinary.uploader.destroy(sliderId)

                const aboutId=data.aboutImage.public_id 
                await cloudinary.uploader.destroy(aboutId)

                const chooseId=data.chooseImage.public_id
                await cloudinary.uploader.destroy(chooseId)

                const sliderResult=await cloudinary.uploader.upload( sliderImage.tempFilePath,
                    {
                        folder:"100acre/aboutPage"
                    })

                const aboutResult=await cloudinary.uploader.upload(aboutImage.tempFilePath ,{
                    folder:"100acre/aboutPage"
                })  
                
                const chooseResult=await cloudinary.uploader.upload(chooseImage.tempFilePath ,{
                    folder:"100acre/aboutPage"
                })

                const dataUpdate= await aboutModel.findById(req.params.id ,{
                    sliderImage:{
                        public_id:sliderResult.public_id,
                        url:sliderResult.secure_url
                     },
                     aboutImage:{
                         public_id:aboutResult.public_id,
                         url:aboutResult.secure_url
                     },
                     chooseImage:{
                         public_id:chooseResult.public_id,
                         url:chooseResult.secure_url
                     },
     
                     sliderHeading:sliderHeading,
                     sliderDescripation:sliderDescripation,
                     aboutHeading:aboutHeading,
                     aboutDescripation:aboutDescripation,
                     chooseHeading:chooseHeading,
                     chooseDescripation:chooseDescripation
                })
            //    console.log(dataUpdate)
            await dataUpdate.save()
            res.status(200).json({
                message:"updated successfully !",
                dataUpdate
            })

            }else if(req.files.sliderImage ){
                    
                const sliderImage=req.files.sliderImage;

                const data=await aboutModel.findById(req.params.id)

                const sliderId=data.sliderImage.public_id
                await cloudinary.uploader.destroy(sliderId)

                const sliderResult=await cloudinary.uploader.upload( sliderImage.tempFilePath,
                    {
                        folder:"100acre/aboutPage"
                    })
                    const dataUpdate= await aboutModel.findById(req.params.id ,{
                        sliderImage:{
                            public_id:sliderResult.public_id,
                            url:sliderResult.secure_url
                         },
                         sliderHeading:sliderHeading,
                         sliderDescripation:sliderDescripation,
                         aboutHeading:aboutHeading,
                         aboutDescripation:aboutDescripation,
                         chooseHeading:chooseHeading,
                         chooseDescripation:chooseDescripation
                    })
                //    console.log(dataUpdate)
                await dataUpdate.save()
                res.status(200).json({
                    message:"updated successfully !",
                    dataUpdate
                })


            }else if( req.files.aboutImage ){

               const aboutImage=req.files.aboutImage;

                const data=await aboutModel.findById(req.params.id)

                const aboutId=data.aboutImage.public_id
                await cloudinary.uploader.destroy(aboutId)

                const aboutResult=await cloudinary.uploader.upload( aboutImage.tempFilePath,
                    {
                        folder:"100acre/aboutPage"
                    })
                    const dataUpdate= await aboutModel.findById(req.params.id ,{
                        aboutImage:{
                            public_id:aboutResult.public_id,
                            url:aboutResult.secure_url
                         },
                         sliderHeading:sliderHeading,
                         sliderDescripation:sliderDescripation,
                         aboutHeading:aboutHeading,
                         aboutDescripation:aboutDescripation,
                         chooseHeading:chooseHeading,
                         chooseDescripation:chooseDescripation
                    })
                //    console.log(dataUpdate)
                await dataUpdate.save()
                res.status(200).json({
                    message:"updated successfully !",
                    dataUpdate
                })
            }else if( req.files.chooseImage){
                const chooseImage=req.files.chooseImage;

                const data=await aboutModel.findById(req.params.id)

                const chooseId=data.chooseImage.public_id
                await cloudinary.uploader.destroy(chooseId)

                const chooseResult=await cloudinary.uploader.upload(chooseImage.tempFilePath,
                    {
                        folder:"100acre/aboutPage"
                    })
                    const dataUpdate= await aboutModel.findById(req.params.id ,{
                        chooseImage:{
                            public_id:chooseResult.public_id,
                            url:chooseResult.secure_url
                         },
                         sliderHeading:sliderHeading,
                         sliderDescripation:sliderDescripation,
                         aboutHeading:aboutHeading,
                         aboutDescripation:aboutDescripation,
                         chooseHeading:chooseHeading,
                         chooseDescripation:chooseDescripation
                    })
                //    console.log(dataUpdate)
                await dataUpdate.save()
                res.status(200).json({
                    message:"updated successfully !",
                    dataUpdate
                })
            }
           } else{

            const dataUpdate= await aboutModel.findById(req.params.id ,{
                chooseImage:{
                    public_id:chooseResult.public_id,
                    url:chooseResult.secure_url
                 },
                 sliderHeading:sliderHeading,
                 sliderDescripation:sliderDescripation,
                 aboutHeading:aboutHeading,
                 aboutDescripation:aboutDescripation,
                 chooseHeading:chooseHeading,
                 chooseDescripation:chooseDescripation
            })
            await dataUpdate.save()
            res.status(200).json({
                message:"updated successfully !",
                dataUpdate
            })
              
           } 
        
        
        }  
    } catch (error) {
     console.log(error)   
     res.status(500).json({
       message:"something went wrong ! " , 
     })
    }
}

static aboutDelete=async(req,res)=>{
    // res.send("hello delete ")
    try {
        
    } catch (error) {
        
    }
}


//Testimonial part 
static testimonialInsert=async(req,res)=>{
  res.send("hello insert")
}

static testimonialView=async(req,res)=>{
res.send("hello View")
}

static testimonialEdit=async(req,res)=>{
  res.send("hello edit")
}
static testimonialUpdate=async(req,res)=>{
  res.send("hello update")
}
static testimonialDelete=async(req,res)=>{
  res.send("hello delete")
}

}
module.exports=aboutController






