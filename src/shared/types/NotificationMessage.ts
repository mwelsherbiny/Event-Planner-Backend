export enum NotificationType {
  CHAT = "CHAT",
  SYSTEM = "SYSTEM",
  SESSION = "SESSION",
  TRAINING = "TRAINING",
}

export interface ForegroundNotification {
  data: {
    notificationType: NotificationType;
    [key: string]: string;
  };
}

export interface BackgroundNotification extends ForegroundNotification {
  notification: {
    title: string;
    body: string;
  };
}
