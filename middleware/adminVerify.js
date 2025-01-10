const jwt = require("jsonwebtoken");

const adminVerify = (req, res, next) => {
  const {token} = req.cookies.token;
  const decoded = jwt.verify(token, "amitchaudhary100");
  req.user = decoded;
  next();
};

module.exports = adminVerify;