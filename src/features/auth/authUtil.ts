import type { User } from "@prisma/client";
import { throwInvalidTokenError } from "../../errors/authErrors.js";
import {
  JwtPayloadSchema,
  type JwtPayload,
} from "../../shared/schemas/JwtPayloadSchema.js";
import jwt from "jsonwebtoken";

export function removeSensitiveData(user: User) {
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}

export function generateOtp(length = 6): string {
  let otp = "";
  const digits = "0123456789";
  const digitsLength = digits.length;
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digitsLength));
  }
  return otp;
}

export function jwtVerify(token: string, secret: string): JwtPayload {
  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    const parsedPayload = JwtPayloadSchema.parse(payload);
    return parsedPayload;
  } catch (_error) {
    throwInvalidTokenError();
  }
}
