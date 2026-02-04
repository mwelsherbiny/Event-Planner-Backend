import {
  NotificationType,
  NotificationTarget,
  Prisma,
  EventRole,
} from "@prisma/client";

export interface ForegroundNotification {
  data: {
    type: NotificationType;
    title: string;
    body: string;
  };
}

export interface PushNotification extends ForegroundNotification {
  notification: {
    title: string;
    body: string;
  };
}

interface BaseNotificationJsonData {
  title: string;
  body: string;
  [key: string]: Prisma.JsonValue;
}

interface InviteNotificationJsonData extends BaseNotificationJsonData {
  eventId: number;
  eventName: string;
  role: EventRole;
}

export interface CreateNotificationData {
  type: NotificationType;
  senderId?: number;
  targetId?: number;
  targetType?: NotificationTarget;
  data: BaseNotificationJsonData;
}

export interface CreateInviteNotificationData extends CreateNotificationData {
  type: "INVITE";
  targetType: "INVITE";
  data: InviteNotificationJsonData;
}
