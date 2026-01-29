import { ErrorCode } from "../shared/types/enums.js";
import AppError from "./AppError.js";

export function throwAuthError(): never {
  throw new AppError({
    message: "Invalid email or password",
    statusCode: 401,
    code: ErrorCode.AUTH_FAILED,
  });
}

export function throwUserAlreadyVerifiedError(): never {
  throw new AppError({
    message: "User email is already verified",
    statusCode: 409,
    code: ErrorCode.USER_ALREADY_VERIFIED,
  });
}

export function throwUnverifiedUserError(): never {
  throw new AppError({
    message: "User email is not verified",
    statusCode: 401,
    code: ErrorCode.UNVERIFIED_USER,
  });
}

export function throwInvalidTokenError(): never {
  throw new AppError({
    message: "Invalid or expired token",
    statusCode: 401,
    code: ErrorCode.INVALID_TOKEN,
  });
}

export function throwMissingTokenError(): never {
  throw new AppError({
    message: "Token required",
    statusCode: 401,
    code: ErrorCode.MISSING_TOKEN,
  });
}

export function throwUserNotFoundError(): never {
  throw new AppError({
    message: "User not found",
    statusCode: 404,
    code: ErrorCode.USER_NOT_FOUND,
  });
}

export function throwFailedToSendEmailError(): never {
  throw new AppError({
    message: "Failed to send email",
    statusCode: 500,
    code: ErrorCode.EMAIL_SENDING_FAILED,
  });
}

export function throwUserAlreadyExistsError(): never {
  throw new AppError({
    message: "User already exists",
    statusCode: 409,
    code: ErrorCode.USER_ALREADY_EXISTS,
  });
}

export function throwEmailAlreadyExistsError(): never {
  throw new AppError({
    message: "Email already exists",
    statusCode: 409,
    code: ErrorCode.EMAIL_ALREADY_EXISTS,
  });
}

export function throwInvalidOtpError(): never {
  throw new AppError({
    message: "Invalid or expired OTP code",
    statusCode: 400,
    code: ErrorCode.INVALID_OTP,
  });
}

export function throwInvalidDataError(
  errors: readonly {
    field: string;
    code: string;
  }[],
): never {
  throw new AppError({
    message: "Invalid request data",
    statusCode: 400,
    code: ErrorCode.INVALID_DATA,
    details: errors,
  });
}
