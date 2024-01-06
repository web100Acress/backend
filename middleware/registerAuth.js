const jwt = require('jsonwebtoken')

const postPropertyModel=require('../models/postProperty/post')

const authAdmin = async (req, res, next) => {
    try {
      
        const { token } = req.cookies
        const verify_token = jwt.verify(token, 'amitchaudhary100')
        const admin_data = await postPropertyModel.findOne({ _id: verify_token.user_id })
        req.admin = admin_data
        next()
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message:"error in authentication ! "
        })
    }
}
module.exports = authAdmin
