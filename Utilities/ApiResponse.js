class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

const sendOk = (res, message, data = null) => {
  return res.status(200).json({
    success: true,
    message,
    data
  });
};

module.exports = { ApiResponse, sendOk };