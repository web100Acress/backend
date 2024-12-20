const jwt =require('jsonwebtoken')
require('dotenv').config()
const generateTokenAndset=(userId,res)=>{

const token=jwt.sign({userId},process.env.JWT_SECRET,
    {
        expiresIn:"15d"
    }
)
console.log(token,"lsdwl")
res.cookie("jwt",token,{
maxAge: 15 * 24 * 60 * 60 * 1000,
httpOnly:true, // prevent XSS attacks cross-site scripting attacks
samesite:"strict", // CSRF attacks cross-site request forgery attacks
secure: process.env.NODE_ENV !== "development",
})
}
module.exports=generateTokenAndset