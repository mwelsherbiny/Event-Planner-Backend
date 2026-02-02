import type {
  NotificationType,
  NotificationTarget,
  Prisma,
} from "@prisma/client";

export interface ForegroundNotification {
  data: {
    notificationType: NotificationType;
    [key: string]: string;
  };
}

export interface PushNotification extends ForegroundNotification {
  notification: {
    title: string;
    body: string;
  };
}

export interface CreateNotificationData {
  type: NotificationType;
  senderId?: number;
  targetId?: number;
  targetType?: NotificationTarget;
  data: Record<string, Prisma.JsonValue>;
}
