import { ErrorCode } from "./error-codes.js";

class AppError extends Error {
  statusCode: number;
  code: string;
  error: unknown;
  details?: readonly Record<string, unknown>[] | undefined;

  constructor({
    message,
    statusCode,
    code,
    details,
  }: {
    message: string;
    statusCode: number;
    code: ErrorCode;
    details?: readonly Record<string, unknown>[];
  }) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static internalError() {
    return new AppError({
      message: "Internal server error",
      statusCode: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
    });
  }

  getObject() {
    const errorObject = {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
    };

    if (this.details) {
      return { ...errorObject, details: this.details };
    }

    return errorObject;
  }
}

export default AppError;
