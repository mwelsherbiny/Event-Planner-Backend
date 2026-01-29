import { config } from "../../config/config.js";
import {
  createRefreshToken,
  deleteRefreshToken,
  getRefreshToken,
} from "../../shared/repositories/refreshTokenRepo.js";
import {
  createUser,
  getUserByEmail,
  getUserByEmailOrUsername,
  getUserById,
  updateUserRepo,
} from "../user/userRepo.js";
import type { LoginUserBody, RegisterUserBody } from "../user/userSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  throwAuthError,
  throwFailedToSendEmailError,
  throwInvalidOtpError,
  throwInvalidTokenError,
  throwUnverifiedUserError,
  throwUserAlreadyExistsError,
  throwUserAlreadyVerifiedError,
  throwUserNotFoundError,
} from "../../errors/authErrors.js";
import { jwtVerify, removeSensitiveData } from "./authUtil.js";
import { generateOtp } from "./authUtil.js";
import {
  createOtpCode,
  getMostRecentOtpCodeByUserId,
} from "../../shared/repositories/otpCodeRepo.js";
import { getOtpEmailText, sendEmail } from "../../shared/util/email.js";
import type { JwtPayload } from "../../shared/schemas/JwtPayloadSchema.js";
import { OtpType } from "@prisma/client";
import expiryAsDate from "../../shared/util/expiryAsDate.js";

export async function loginUser(user: LoginUserBody) {
  const storedUser = await getUserByEmail(user.email);
  if (!storedUser) {
    throwAuthError();
  }
  if (!storedUser.isVerified) {
    throwUnverifiedUserError();
  }

  // Verify passwords
  await verifyPassword(user.password, storedUser.passwordHash);

  // Generate JWT tokens
  const payload: JwtPayload = { userId: storedUser.id };
  const newRefreshToken = signRefreshToken(payload);
  const newAccessToken = signAccessToken(payload);

  // Store refresh token in the database
  await createRefreshToken(newRefreshToken, storedUser.id);
  // remove sensitive info before sending user data
  const publicUser = removeSensitiveData(storedUser);

  return {
    publicUser,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function registerUser(user: RegisterUserBody) {
  // Check if user with the same email/username already exists
  const storedUser = await getUserByEmailOrUsername(user.email, user.username);
  if (storedUser) {
    throwUserAlreadyExistsError();
  }

  // Create a new unverified user
  const salt = 10;
  const { password, ...userData } = user;
  const passwordHash = await bcrypt.hash(password, salt);
  const createdUser = await createUser({ ...userData, passwordHash });
  return removeSensitiveData(createdUser);
}

export async function logoutUser(refreshToken: string) {
  const storedToken = await getRefreshToken(refreshToken);
  if (!storedToken || storedToken.expiresAt < new Date()) {
    return { isAlreadyLoggedOut: true };
  }

  const { count } = await deleteRefreshToken(refreshToken);
  if (count === 0) {
    return { isAlreadyLoggedOut: false };
  }
  return { isAlreadyLoggedOut: false };
}

export async function refresh(refreshToken: string) {
  const storedToken = await getRefreshToken(refreshToken);
  if (!storedToken || storedToken.expiresAt < new Date()) {
    throwInvalidTokenError();
  }

  const payload = jwtVerify(refreshToken, config.REFRESH_TOKEN_SECRET);

  const newRefreshToken = signRefreshToken(payload);
  const newAccessToken = signAccessToken(payload);
  await rotateRefreshToken({
    userId: payload.userId,
    newRefreshToken,
    oldRefreshToken: refreshToken,
  });

  return { newAccessToken, newRefreshToken };
}

export async function verifyUser({
  email,
  otpCode,
}: {
  email: string;
  otpCode: string;
}) {
  const user = await assertUserEmailExists(email);
  if (user.isVerified) {
    return { isAlreadyVerified: true };
  }

  const userId = user.id;

  const mostRecentOtp = await getMostRecentVerificationOtp(userId);
  await compareOtpCodes(otpCode, mostRecentOtp);
  await updateUserRepo(userId, { isVerified: true });

  const payload = { userId };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await createRefreshToken(refreshToken, userId);

  return { accessToken, refreshToken, isAlreadyVerified: false };
}

export async function sendVerificationEmail(email: string) {
  const user = await assertUserEmailExists(email);
  if (user.isVerified) {
    throwUserAlreadyVerifiedError();
  }

  await sendAuthEmail({
    email,
    userId: user.id,
    otpType: OtpType.EMAIL_VERIFICATION,
  });
}

export async function sendResetPasswordEmail(email: string) {
  const user = await assertUserEmailExists(email);
  await sendAuthEmail({
    email,
    userId: user.id,
    otpType: OtpType.PASSWORD_RESET,
  });
}

export async function verifyPasswordReset({
  email,
  otpCode,
}: {
  email: string;
  otpCode: string;
}) {
  const user = await assertUserEmailExists(email);
  const userId = user.id;

  const storedOtpCode = await getMostRecentPasswordResetOtp(userId);
  await compareOtpCodes(otpCode, storedOtpCode);

  const payload = { userId };
  const resetToken = jwt.sign(payload, config.RESET_TOKEN_SECRET, {
    expiresIn: config.RESET_TOKEN_EXPIRY,
  });

  return resetToken;
}

export async function resetPassword({
  resetToken,
  newPassword,
}: {
  resetToken: string;
  newPassword: string;
}) {
  const payload = jwtVerify(resetToken, config.RESET_TOKEN_SECRET);
  const userId = payload.userId;

  await assertUserIdExists(userId);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updateUserRepo(userId, { passwordHash });
}

export function signAccessToken(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, config.ACCESS_TOKEN_SECRET, {
    expiresIn: config.ACCESS_TOKEN_EXPIRY,
  });
  return accessToken;
}

export function signRefreshToken(payload: JwtPayload) {
  const refreshToken = jwt.sign(payload, config.REFRESH_TOKEN_SECRET, {
    expiresIn: config.REFRESH_TOKEN_EXPIRY,
  });
  return refreshToken;
}

export function signResetToken(payload: JwtPayload) {
  const resetToken = jwt.sign(payload, config.RESET_TOKEN_SECRET, {
    expiresIn: config.RESET_TOKEN_EXPIRY,
  });
  return resetToken;
}

export async function getMostRecentVerificationOtp(userId: number) {
  const otpCode = await getMostRecentOtp(userId, OtpType.EMAIL_VERIFICATION);
  return otpCode;
}

export async function getMostRecentPasswordResetOtp(userId: number) {
  const otpCode = await getMostRecentOtp(userId, OtpType.PASSWORD_RESET);
  return otpCode;
}

export async function compareOtpCodes(
  providedOtp: string,
  storedOtpHash: string,
) {
  const otpMatch = await bcrypt.compare(providedOtp, storedOtpHash);
  if (!otpMatch) {
    throwInvalidOtpError();
  }

  return true;
}

// Helper methods

async function verifyPassword(plainPassword: string, hashedPassword: string) {
  const passwordMatch = await bcrypt.compare(plainPassword, hashedPassword);

  if (!passwordMatch) {
    throwAuthError();
  }
}

async function rotateRefreshToken({
  newRefreshToken,
  oldRefreshToken,
  userId,
}: {
  newRefreshToken: string;
  oldRefreshToken: string;
  userId: number;
}) {
  await createRefreshToken(newRefreshToken, userId);
  await deleteRefreshToken(oldRefreshToken);
}

async function issueOtpCode({
  userId,
  otpType,
}: {
  userId: number;
  otpType: OtpType;
}) {
  const emailOtp = generateOtp();
  const emailOtpHash = await bcrypt.hash(emailOtp, 10);

  await createOtpCode(
    emailOtpHash,
    userId,
    otpType,
    expiryAsDate(config.OTP_CODE_EXPIRY),
  );

  return emailOtp;
}

async function sendOtpEmail({
  email,
  otpCode,
  otpType,
}: {
  email: string;
  otpCode: string;
  otpType: OtpType;
}) {
  const { message, subject } = getOtpEmailText({
    otpType,
    otpCode,
  });
  try {
    await sendEmail({
      email,
      subject,
      message,
    });
  } catch (_error) {
    throwFailedToSendEmailError();
  }
}

async function sendAuthEmail({
  email,
  userId,
  otpType,
}: {
  email: string;
  userId: number;
  otpType: OtpType;
}) {
  const otpCode = await issueOtpCode({
    userId,
    otpType,
  });
  await sendOtpEmail({
    email,
    otpCode,
    otpType,
  });
}

async function getMostRecentOtp(userId: number, otpType: OtpType) {
  const storedOtpCode = await getMostRecentOtpCodeByUserId(userId, otpType);

  if (!storedOtpCode || storedOtpCode.expiresAt < new Date()) {
    throwInvalidOtpError();
  }

  return storedOtpCode.code;
}

async function assertUserEmailExists(email: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    throwUserNotFoundError();
  }

  return user;
}

async function assertUserIdExists(userId: number) {
  const user = await getUserById(userId);
  if (!user) {
    throwUserNotFoundError();
  }

  return user;
}
