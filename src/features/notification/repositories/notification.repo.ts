import { NotificationTarget, NotificationType } from "@prisma/client";
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
    type: string,
  ) => {
    const whereClause =
      type === "invite"
        ? {
            receiverId: userId,
            notification: { type: NotificationType.INVITE },
          }
        : {
            receiverId: userId,
            notification: { NOT: { type: NotificationType.INVITE } },
          };

    const notifications = await prisma.notificationReceiver.findMany({
      where: whereClause,
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

  countUnreadNotifications: async (userId: number, type: string) => {
    let notificationFilter;
    switch (type) {
      case "invite":
        notificationFilter = {
          notification: { type: NotificationType.INVITE },
        };
        break;
      case "general":
        notificationFilter = {
          notification: {
            type: { not: NotificationType.INVITE },
          },
        };
        break;
      case "total":
        notificationFilter = {};
        break;
      default:
        notificationFilter = {};
    }

    const count = await prisma.notificationReceiver.count({
      where: {
        receiverId: userId,
        read: false,
        ...notificationFilter,
      },
    });

    return count;
  },

  deleteNotificationById: async (userId: number, notificationId: number) => {
    const result = await prisma.notificationReceiver.deleteMany({
      where: { receiverId: userId, notificationId },
    });

    return result.count;
  },

  markAllNotificationsAsRead: async (userId: number, type: string) => {
    const notificationTypes =
      type === "invite"
        ? [NotificationType.INVITE]
        : [
            NotificationType.CANCELLATION,
            NotificationType.REMINDER,
            NotificationType.SYSTEM,
          ];

    await prisma.notificationReceiver.updateMany({
      where: {
        receiverId: userId,
        read: false,
        notification: {
          type: {
            in: notificationTypes,
          },
        },
      },
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
