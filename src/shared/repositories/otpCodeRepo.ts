import prisma from "../../db.js";
import { OtpType } from "@prisma/client";
export const createOtpCode = async (
  code: string,
  userId: number,
  type: OtpType,
  expiresAt: Date,
) =>
  prisma.otpCode.create({
    data: {
      code,
      userId,
      type,
      expiresAt,
    },
  });

export const getMostRecentOtpCodeByUserId = async (
  userId: number,
  type: OtpType,
) =>
  prisma.otpCode.findFirst({
    where: {
      userId,
      type,
    },
    orderBy: { createdAt: "desc" },
  });
