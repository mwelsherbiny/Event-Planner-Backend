// import { sendForegroundNotification } from "../features/notification/notificationService.js";
// import {
//   NotificationType,
//   type ForegroundNotification,
// } from "../shared/types/NotificationMessage.js";

import EventService from "../features/event/event.service.js";

// // This registration token comes from the client FCM SDKs.

// const userId = 1;

// const notificationMessage: ForegroundNotification = {
//   data: {
//     key1: "value1",
//     key2: "value2",
//     notificationType: NotificationType.SYSTEM,
//   },
// };
// try {
//   await sendForegroundNotification(notificationMessage, [userId]);
// } catch (error) {
//   console.error("Error sending notification:", error);
// }
const EVENT_ID = 292;
await EventService.notifyEventCancellation({
  id: EVENT_ID,
  name: "Test Event",
});
