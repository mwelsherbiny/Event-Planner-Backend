import prisma from "../../db.js";

export const createFcmToken = async (userId: number, fcmToken: string) => {
  return prisma.fcmToken.create({
    data: {
      userId,
      token: fcmToken,
    },
  });
};

export const getFcmTokenByToken = async (fcmToken: string) => {
  return prisma.fcmToken.findUnique({
    where: { token: fcmToken },
  });
};

export const getFcmTokenByUserIds = async (userIds: [number, ...number[]]) => {
  if (typeof userIds === "number") {
    userIds = [userIds];
  }

  return prisma.fcmToken.findMany({
    where: { userId: { in: userIds } },
  });
};

export const deleteFcmTokenByToken = async (fcmToken: string) => {
  return prisma.fcmToken.delete({
    where: { token: fcmToken },
  });
};
