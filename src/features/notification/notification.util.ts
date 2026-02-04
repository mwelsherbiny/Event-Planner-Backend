import type { CreateNotificationData } from "./notification.types.js";

export function mapNotificationToFcmPayload(
  notification: CreateNotificationData,
) {
  const { data, ...rest } = notification;

  return {
    notification: {
      title: notification.data.title,
      body: notification.data.body,
    },
    data: {
      ...rest,
      ...data,
    },
  };
}
