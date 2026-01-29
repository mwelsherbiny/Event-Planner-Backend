// import firebase from "../../shared/services/firebase.js";
// import type {
//   BackgroundNotification,
//   ForegroundNotification,
// } from "../../shared/types/NotificationMessage.js";
// import {
//   deleteFcmTokenByToken,
//   getFcmTokenByUserIds,
// } from "../../shared/repositories/fcmTokenRepo.js";
// import type { MulticastMessage } from "firebase-admin/messaging";

// export async function sendBackgroundNotification(
//   backgroundNotification: BackgroundNotification,
//   userIds: [number, ...number[]],
// ) {
//   await sendNotification(backgroundNotification, userIds);
// }

// export async function sendForegroundNotification(
//   foregroundNotification: ForegroundNotification,
//   userIds: [number, ...number[]],
// ) {
//   await sendNotification(foregroundNotification, userIds);
// }

// async function sendNotification(
//   notification: BackgroundNotification | ForegroundNotification,
//   userIds: [number, ...number[]],
// ) {
//   // Find the registration tokens for the given user IDs
//   const fcmTokensStrings = await getFcmTokensStrings(userIds);

//   // Store the notifications in the database for the specified users
//   // await createNotificationForUsers(notification, userIds);

//   // Send the notification via Firebase Cloud Messaging
//   const result = await sendFcmNotification(notification, fcmTokensStrings);

//   // delete invalid tokens
//   if (result.failureCount > 0) {
//     await Promise.all(
//       result.responses.map(async (resp, idx) => {
//         if (
//           resp.error?.message === "messaging/registration-token-not-registered"
//         ) {
//           await deleteFcmTokenByToken(fcmTokensStrings[idx]!);
//         }
//       }),
//     );
//   }
// }

// async function getFcmTokensStrings(userIds: [number, ...number[]]) {
//   const fcmTokens = await getFcmTokenByUserIds(userIds);
//   if (fcmTokens.length === 0) {
//     throw new Error("No FCM tokens found for the given user IDs");
//   }
//   const fcmTokensStrings = fcmTokens.map((token) => token.token);
//   return fcmTokensStrings;
// }

// async function sendFcmNotification(
//   notification: BackgroundNotification | ForegroundNotification,
//   fcmTokensStrings: string[],
// ) {
//   const fcmMessage: MulticastMessage = {
//     ...notification,
//     tokens: fcmTokensStrings,
//   };

//   const result = await firebase.messaging().sendEachForMulticast(fcmMessage);
//   return result;
// }
