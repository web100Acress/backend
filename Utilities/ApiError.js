class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
    this.data = null;
    this.success = false;
    this.errors = [];
    this.stack = '';
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad request') {
    super(400, message);
    this.name = 'BadRequestError';
    this.data = null;
    this.success = false;
    this.errors = [];
    this.stack = '';
  }
}


module.exports = { ApiError, NotFoundError, BadRequestError };
