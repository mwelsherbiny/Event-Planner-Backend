// import type { Request, Response, NextFunction } from "express";
// import {
//   createFcmToken,
//   getFcmTokenByToken,
// } from "../../shared/repositories/fcmTokenRepo.js";
// import {
//   countUnreadNotifications,
//   deleteNotificationById,
//   getNotificationsByUserId,
//   markAllNotificationsAsRead,
// } from "./notificationRepo.js";

// const notificationController = {
//   registerFcmToken: async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { token: fcmToken } = req.body;
//       const userId = req.payload!.userId;

//       if (!fcmToken) {
//         return res
//           .status(400)
//           .json({ success: false, error: "FCM token is required" });
//       }

//       const existingToken = await getFcmTokenByToken(fcmToken);
//       if (existingToken) {
//         return res
//           .status(400)
//           .json({ success: false, error: "FCM token already registered" });
//       }

//       await createFcmToken(userId, fcmToken);
//       res
//         .status(201)
//         .json({ success: true, message: "FCM token registered successfully" });
//     } catch (error) {
//       next(error);
//     }
//   },
//   getNotifications: async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const userId = req.payload!.userId;
//       const page = parseInt(req.query.page as string, 10) || 1;
//       const limit = parseInt(req.query.limit as string, 10) || 20;

//       const notifications = await getNotificationsByUserId(userId, page, limit);
//       res.status(200).json({ success: true, data: { notifications } });
//     } catch (error) {
//       next(error);
//     }
//   },
//   countUnread: async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const userId = req.payload!.userId;
//       const count = await countUnreadNotifications(userId);
//       res.status(200).json({ success: true, data: { count } });
//     } catch (error) {
//       next(error);
//     }
//   },
//   deleteNotification: async (
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ) => {
//     try {
//       const userId = req.payload!.userId;
//       const notificationId = parseInt(req.params.id!, 10);
//       // userId is included to ensure users can only delete their own notifications
//       const deletedCount = await deleteNotificationById(userId, notificationId);
//       if (deletedCount === 0) {
//         return res
//           .status(404)
//           .json({ success: false, error: "Notification not found" });
//       }
//       res
//         .status(200)
//         .json({ success: true, message: "Notification deleted successfully" });
//     } catch (error) {
//       next(error);
//     }
//   },
//   readAll: async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const userId = req.payload!.userId;
//       await markAllNotificationsAsRead(userId);
//       res.status(200).json({
//         success: true,
//         message: "All notifications marked as read successfully",
//       });
//     } catch (error) {
//       next(error);
//     }
//   },
// };

// export default notificationController;
