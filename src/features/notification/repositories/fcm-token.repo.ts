import prisma from "../../../integrations/db/db.config.js";

const FcmTokenRepository = {
  createFcmToken: async (userId: number, fcmToken: string) => {
    return prisma.fcmToken.create({
      data: {
        userId,
        token: fcmToken,
      },
    });
  },

  getFcmTokenByToken: async (fcmToken: string) => {
    return prisma.fcmToken.findUnique({
      where: { token: fcmToken },
    });
  },

  getFcmTokenByUserIds: async (userIds: [number, ...number[]]) => {
    if (typeof userIds === "number") {
      userIds = [userIds];
    }

    return prisma.fcmToken.findMany({
      where: { userId: { in: userIds } },
    });
  },

  deleteFcmTokenByToken: async (fcmToken: string) => {
    return prisma.fcmToken.delete({
      where: { token: fcmToken },
    });
  },
};

export default FcmTokenRepository;
