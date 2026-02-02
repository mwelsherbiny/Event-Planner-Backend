import { sendFcmNotification } from "../../integrations/firebase/fcm.integration.js";
import type {
  PushNotification,
  ForegroundNotification,
  CreateNotificationData,
} from "./notification.types.js";
import FcmTokenRepository from "./repositories/fcm-token.repo.js";
import NotificationRepository from "./repositories/notification.repo.js";
import AppError from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/error-codes.js";

const NotificationService = {
  registerFcmToken: async (userId: number, fcmToken: string) => {
    const existingToken = await FcmTokenRepository.getFcmTokenByToken(fcmToken);
    if (existingToken) {
      throw new AppError({
        message: "FCM token already registered",
        statusCode: 400,
        code: ErrorCode.FCM_TOKEN_ALREADY_REGISTERED,
      });
    }

    await FcmTokenRepository.createFcmToken(userId, fcmToken);
  },

  getPaginatedNotifications: async (
    userId: number,
    page: number,
    limit: number,
  ) => {
    return NotificationRepository.getNotificationsByUserId(userId, page, limit);
  },

  storeNotificationForUsers: async (
    notificationData: CreateNotificationData,
    userIds: [number, ...number[]],
  ) => {
    await NotificationRepository.createNotificationForUsers(
      notificationData,
      userIds,
    );
  },

  findUnreadCount: async (userId: number) => {
    return NotificationRepository.countUnreadNotifications(userId);
  },

  deleteNotification: async (userId: number, notificationId: number) => {
    // userId is included to ensure users can only delete their own notifications
    const deletedCount = await NotificationRepository.deleteNotificationById(
      userId,
      notificationId,
    );
    if (deletedCount === 0) {
      throw new AppError({
        message: "Notification not found",
        statusCode: 404,
        code: ErrorCode.NOTIFICATION_NOT_FOUND,
      });
    }
  },

  markAllAsRead: async (userId: number) => {
    await NotificationRepository.markAllNotificationsAsRead(userId);
  },

  sendNotification: async (
    notification: PushNotification | ForegroundNotification,
    userIds: [number, ...number[]],
  ) => {
    // Find the registration tokens for the given user IDs
    const fcmTokensStrings = await getFcmTokensStrings(userIds);

    // Send the notification via Firebase Cloud Messaging
    const result = await sendFcmNotification(notification, fcmTokensStrings);

    // delete invalid tokens
    if (result.failureCount > 0) {
      await Promise.all(
        result.responses.map(async (resp, idx) => {
          if (
            resp.error?.message ===
            "messaging/registration-token-not-registered"
          ) {
            await FcmTokenRepository.deleteFcmTokenByToken(
              fcmTokensStrings[idx]!,
            );
          }
        }),
      );
    }
  },
};

async function getFcmTokensStrings(userIds: [number, ...number[]]) {
  const fcmTokens = await FcmTokenRepository.getFcmTokenByUserIds(userIds);
  if (fcmTokens.length === 0) {
    throw new Error("No FCM tokens found for the given user IDs");
  }
  const fcmTokensStrings = fcmTokens.map((token) => token.token);
  return fcmTokensStrings;
}

export default NotificationService;
