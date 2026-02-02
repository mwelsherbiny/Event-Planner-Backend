import { config } from "../../../config/config.js";
import prisma from "../../../integrations/db/db.config.js";
import expiryAsDate from "../../../shared/util/expiry.util.js";

const RefreshTokenRepository = {
  createRefreshToken: async (generatedToken: string, userId: number) =>
    prisma.refreshToken.create({
      data: {
        token: generatedToken,
        userId,
        expiresAt: expiryAsDate(config.REFRESH_TOKEN_EXPIRY),
      },
    }),

  getRefreshToken: async (token: string) =>
    await prisma.refreshToken.findUnique({
      where: { token },
    }),

  deleteRefreshToken: async (token: string) =>
    await prisma.refreshToken.deleteMany({
      where: { token },
    }),
};

export default RefreshTokenRepository;
