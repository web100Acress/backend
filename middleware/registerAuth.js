const jwt = require('jsonwebtoken')
const postPropertyModel = require('../models/postProperty/post')
require('dotenv').config()

const authAdmin = async (req, res, next) => {
  try {
    // res.send("hello auth")
    const  token  = req.cookies.jwt
    
		if (!token) {
			return res.status(401).json({ error: "Unauthorized - No Token Provided" });
		}

      const verify_token = jwt.verify(token, process.env.JWT_SECRET)
      
		if (!verify_token) {
			return res.status(401).json({ error: "Unauthorized - Invalid Token" });
		}

      
      const admin_data = await postPropertyModel.findOne({ _id: verify_token.userId })
      
      if (!admin_data) {
        return res.status(404).json({ error: "User not found" });
      }
      req.admin = admin_data
      next()
  
  } catch (error) {
    console.log(error)
    res.status(500).json({
      error:error
    })
  }
}
module.exports = authAdmin
