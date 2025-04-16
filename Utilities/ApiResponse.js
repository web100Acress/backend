class ApiResponse {
  constructor(res, statusCode, message, data, pagination) {
    this.res = res;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.pagination = pagination;
  }

  send() {
    const response = {
      success: true,
      status: this.statusCode,
      message: this.message,
      data: this.data || null
    };

    if (this.pagination) {
      response.pagination = this.pagination;
    }

    return this.res.status(this.statusCode).json(response);
  }

  // Helper for empty responses (e.g., DELETE operations)
  sendNoContent() {
    return this.res.status(this.statusCode).end();
  }
}

// Convenience methods for common status codes
const sendOk = (res, message, data) => 
  new ApiResponse(res, 200, message, data).send();

const sendCreated = (res, message, data) => 
  new ApiResponse(res, 201, message, data).send();

const sendPaginated = (res, message, data, pagination) => 
  new ApiResponse(res, 200, message, data, pagination).send();

module.exports = { ApiResponse, sendOk, sendCreated, sendPaginated };