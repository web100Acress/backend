const jwt = require('jsonwebtoken')

const registerModel = require("../models/register/registerModel")

const authAdmin = async (req, res, next) => {
    try {
        res.send("hello auth")
        const { token } = req.cookies
        //    res.send(token)

        const verify_token = jwt.verify(token, 'amitchaudhary100')
        console.log(verify_token)
        const admin_data = await registerModel.findOne({ _id: verify_token.user_id })
        // console.log(admin_data)
        req.admin = admin_data
        next()


    } catch (error) {
        console.log(error)

    }

}
module.exports = authAdmin








//  const jwt=require('jsonwebtoken')
// const AdminModel=require('../models/admin')



// const admin_auth=async(req,res,next)=>{
// try {
//     //  console.log('hello admin')
// const{token}=req.cookies
// // console.log(token)

// const verify_token=jwt.verify(token,'Amitchaudharyid')
// // console.log(verify_token)
// const admin_data=await AdminModel.findOne({_id:verify_token.user_id})
// // console.log(admin_data)
// req.admin=admin_data
// next()
// } catch (error) {
//  res.redirect('/login')
// }
// }
// module.exports=admin_auth