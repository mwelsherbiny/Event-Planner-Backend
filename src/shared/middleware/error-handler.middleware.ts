import type { NextFunction, Request, Response } from "express";
import AppError from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { MulterError } from "multer";

const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.log(err);

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.FILE_TOO_LARGE,
          message: "File size limit exceeded",
        },
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.FILE_UPLOAD_FAILED,
        message: err.message,
      },
    });
  }
  if (err instanceof AppError) {
    const errObject = err.getObject();
    const { statusCode, ...errNoStatusCode } = errObject;
    return res.status(statusCode).json({
      success: false,
      error: errNoStatusCode,
    });
  } else {
    return res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Internal Server Error",
      },
    });
  }
};

export default errorMiddleware;
