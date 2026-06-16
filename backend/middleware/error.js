import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { ApiError } from '../helpers/ApiError.js';
import { env } from '../config/env.js';

export const errorConverter = (err, _req, _res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let { statusCode, message } = err;
  if (env.isProd && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  // Surface the message to morgan's :message token for error logs.
  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(!env.isProd && { stack: err.stack }),
  };

  if (!env.isProd) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).send(response);
};
