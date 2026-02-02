import prisma from "../../../integrations/db/db.config.js";
import { OtpType } from "@prisma/client";

const OtpRepository = {
  createOtpCode: async (
    code: string,
    userId: number,
    type: OtpType,
    expiresAt: Date,
  ) =>
    await prisma.otpCode.upsert({
      create: {
        code,
        userId,
        type,
        expiresAt,
      },
      where: {
        userId_code_type: {
          code,
          userId,
          type,
        },
      },
      update: {
        expiresAt,
      },
    }),

  getMostRecentOtpCodeByUserId: async (userId: number, type: OtpType) =>
    prisma.otpCode.findFirst({
      where: {
        userId,
        type,
      },
      orderBy: { createdAt: "desc" },
    }),
};

export default OtpRepository;
