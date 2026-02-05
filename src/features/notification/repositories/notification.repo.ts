import { NotificationTarget } from "@prisma/client";
import prisma from "../../../integrations/db/db.config.js";
import type { CreateNotificationData } from "../notification.types.js";

const NotificationRepository = {
  createNotificationForUsers: async (
    notification: CreateNotificationData,
    userIds: [number, ...number[]],
  ) => {
    await prisma.notification.create({
      data: {
        ...notification,
        notificationReceivers: {
          create: userIdArrayMapper(userIds),
        },
      },
    });
  },

  getNotificationsByUserId: async (
    userId: number,
    page: number,
    limit: number,
  ) => {
    const notifications = await prisma.notificationReceiver.findMany({
      where: { receiverId: userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        notification: {
          createdAt: "desc",
        },
      },
      select: { notification: true, read: true, receiverId: true },
    });

    return notifications.map((n) => ({ ...n.notification, read: n.read }));
  },

  countUnreadNotifications: async (userId: number) => {
    const count = await prisma.notificationReceiver.count({
      where: { receiverId: userId, read: false },
    });

    return count;
  },

  deleteNotificationById: async (userId: number, notificationId: number) => {
    const result = await prisma.notificationReceiver.deleteMany({
      where: { receiverId: userId, notificationId },
    });

    return result.count;
  },

  markAllNotificationsAsRead: async (userId: number) => {
    await prisma.notificationReceiver.updateMany({
      where: { receiverId: userId, read: false },
      data: { read: true },
    });
  },

  deleteInviteNotification: async (inviteId: number) => {
    await prisma.notification.deleteMany({
      where: {
        targetId: inviteId,
        targetType: NotificationTarget.INVITE,
      },
    });
  },
};

export default NotificationRepository;

const userIdArrayMapper = (userIds: [number, ...number[]]) => {
  return userIds.map((id) => ({ receiverId: id }));
};
