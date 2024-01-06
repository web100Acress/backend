const jwt = require('jsonwebtoken')

const postPropertyModel=require('../models/postProperty/post')

const authAdmin = async (req, res, next) => {
    try {
        // res.send("hello auth")
        const { token } = req.cookies
        //    res.send(token)

        const verify_token = jwt.verify(token, 'amitchaudhary100')
        // console.log(verify_token)
        const admin_data = await registerModel.findOne({ _id: verify_token.user_id })
        // console.log(admin_data)
        req.admin = admin_data
        next()
    } catch (error) {
        console.log(error)

    }
}
module.exports = authAdmin
