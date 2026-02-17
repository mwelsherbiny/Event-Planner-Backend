import { sendFcmNotification } from "../../integrations/firebase/fcm.integration.js";
import type { CreateNotificationData } from "./notification.types.js";
import FcmTokenRepository from "./repositories/fcm-token.repo.js";
import NotificationRepository from "./repositories/notification.repo.js";
import AppError from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { mapNotificationToFcmPayload } from "./notification.util.js";

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
    type: string,
  ) => {
    return NotificationRepository.getNotificationsByUserId(
      userId,
      page,
      limit,
      type,
    );
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

  findUnreadCount: async (userId: number, type: string) => {
    return NotificationRepository.countUnreadNotifications(userId, type);
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

  markAllAsRead: async (userId: number, type: string) => {
    await NotificationRepository.markAllNotificationsAsRead(userId, type);
  },

  sendNotification: async (
    notification: CreateNotificationData,
    userIds: [number, ...number[]],
  ) => {
    console.log("Sending notification ", notification, " to users:", userIds);

    // Store the notification in the database for the users
    await NotificationService.storeNotificationForUsers(notification, userIds);

    // Find the registration tokens for the given user IDs
    const fcmTokensStrings = await getFcmTokensStrings(userIds);
    console.log("Found FCM tokens: ", fcmTokensStrings);

    if (fcmTokensStrings.length === 0) {
      // No valid FCM tokens found, skip sending notification
      return;
    }

    try {
      // Send the notification via Firebase Cloud Messaging
      const result = await sendFcmNotification(
        mapNotificationToFcmPayload(notification),
        fcmTokensStrings,
      );

      console.log("FCM send result: ", result);
      console.log("FCM send result responses: ", result.responses);

      // delete invalid tokens
      if (result.failureCount > 0) {
        await Promise.all(
          result.responses.map(async (resp, idx) => {
            console.log(resp);
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
    } catch (error) {
      console.log(error);
    }
  },

  deleteInviteNotification: async (inviteId: number) => {
    await NotificationRepository.deleteInviteNotification(inviteId);
  },
};

async function getFcmTokensStrings(userIds: [number, ...number[]]) {
  const fcmTokens = await FcmTokenRepository.getFcmTokenByUserIds(userIds);
  const fcmTokensStrings = fcmTokens.map((token) => token.token);
  return fcmTokensStrings;
}

export default NotificationService;
