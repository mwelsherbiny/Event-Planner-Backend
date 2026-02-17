import type { Request, Response, NextFunction } from "express";
import NotificationRepository from "./repositories/notification.repo.js";
import NotificationService from "./notification.service.js";

const NotificationController = {
  registerFcmToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token: fcmToken } = req.body;
      const userId = req.payload!.userId;

      await NotificationService.registerFcmToken(userId, fcmToken);

      res
        .status(201)
        .json({ success: true, message: "FCM token registered successfully" });
    } catch (error) {
      next(error);
    }
  },

  getNotifications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.payload!.userId;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const type = (req.query.type || "general") as string;

      const notifications = await NotificationService.getPaginatedNotifications(
        userId,
        page,
        limit,
        type,
      );

      res.status(200).json({ success: true, data: { notifications } });
    } catch (error) {
      next(error);
    }
  },

  countUnread: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.payload!.userId;
      const count = await NotificationService.findUnreadCount(userId);
      res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  },

  deleteNotification: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.payload!.userId;
      const notificationId = parseInt(req.params.id!, 10);

      await NotificationRepository.deleteNotificationById(
        userId,
        notificationId,
      );

      res
        .status(200)
        .json({ success: true, message: "Notification deleted successfully" });
    } catch (error) {
      next(error);
    }
  },

  readAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.payload!.userId;
      const type = (req.query.type || "general") as string;

      await NotificationService.markAllAsRead(userId, type);
      res.status(200).json({
        success: true,
        message: "All notifications marked as read successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};

export default NotificationController;
