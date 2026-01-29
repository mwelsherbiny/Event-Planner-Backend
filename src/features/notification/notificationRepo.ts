// import prisma from "../../db.js";
// import type {
//   BackgroundNotification,
//   ForegroundNotification,
// } from "../../shared/types/NotificationMessage.js";

// // export const createNotificationForUsers = async (
// //   notification: ForegroundNotification | BackgroundNotification,
// //   userIds: [number, ...number[]],
// // ) => {
// //   await prisma.notification.create({
// //     data: {
// //       payload: { ...notification },
// //       userNotifications: {
// //         create: userIds.map((id) => ({ userId: id })),
// //       },
// //     },
// //   });
// // };

// export const getNotificationsByUserId = async (
//   userId: number,
//   page: number,
//   limit: number,
// ) => {
//   const notifications = await prisma.userNotification.findMany({
//     where: { userId },
//     skip: (page - 1) * limit,
//     take: limit,
//     orderBy: {
//       notification: {
//         createdAt: "desc",
//       },
//     },
//     select: { notification: true, read: true, userId: true },
//   });

//   return notifications.map((n) => ({ ...n.notification, read: n.read }));
// };

// export const countUnreadNotifications = async (userId: number) => {
//   const count = await prisma.userNotification.count({
//     where: { userId, read: false },
//   });

//   return count;
// };

// export const deleteNotificationById = async (
//   userId: number,
//   notificationId: number,
// ) => {
//   const result = await prisma.userNotification.deleteMany({
//     where: { userId, notificationId },
//   });

//   return result.count;
// };

// export const markAllNotificationsAsRead = async (userId: number) => {
//   await prisma.userNotification.updateMany({
//     where: { userId, read: false },
//     data: { read: true },
//   });
// };
