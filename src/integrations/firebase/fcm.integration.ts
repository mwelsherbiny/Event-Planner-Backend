import firebase from "./firebase.config.js";
import type {
  PushNotification,
  ForegroundNotification,
} from "../../features/notification/notification.types.js";
import type { MulticastMessage } from "firebase-admin/messaging";

export async function sendFcmNotification(
  notification: PushNotification | ForegroundNotification,
  fcmTokensStrings: string[],
) {
  const fcmMessage: MulticastMessage = {
    ...notification,
    tokens: fcmTokensStrings,
  };

  const result = await firebase.messaging().sendEachForMulticast(fcmMessage);
  return result;
}
