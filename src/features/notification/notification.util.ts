import type {
  CreateNotificationData,
  FcmNotification,
} from "./notification.types.js";

export function mapNotificationToFcmPayload(
  notification: CreateNotificationData,
): FcmNotification {
  const { data, ...rest } = notification;

  const restAsString = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [k, String(v)]),
  );

  const dataAsString = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)]),
  );

  return {
    notification: {
      title: notification.data.title,
      body: notification.data.body,
    },
    data: {
      ...restAsString,
      ...dataAsString,
    },
  };
}
