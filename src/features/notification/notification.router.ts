import { Router } from "express";
import NotificationController from "./notification.controller.js";
import { validateData } from "../../shared/middleware/validate.middleware.js";
import { registerFcmTokenSchema } from "./notification.schema.js";

const notificationRouter = Router();

notificationRouter.post(
  "/register-token",
  validateData(registerFcmTokenSchema),
  NotificationController.registerFcmToken,
);
notificationRouter.patch("/read-all", NotificationController.readAll);

notificationRouter.get("/", NotificationController.getNotifications);
notificationRouter.get("/unread-count", NotificationController.countUnread);

notificationRouter.delete("/:id", NotificationController.deleteNotification);

export default notificationRouter;
