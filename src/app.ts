import express from "express";
import type { Application, Request, Response } from "express";
import { config } from "./config/config.js";
import morgan from "morgan";
import errorMiddleware from "./shared/middleware/error-handler.middleware.js";
import authRouter from "./features/auth/auth.router.js";
import notFoundMiddleware from "./shared/middleware/notFoundMiddleware.js";
import userRouter from "./features/user/user.router.js";
import { verifyToken } from "./shared/middleware/verify-token.middleware.js";
import notificationRouter from "./features/notification/notification.router.js";
import eventRouter from "./features/event/event.router.js";
import inviteRouter from "./features/invite/invite.router.js";

const app: Application = express();
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// General middleware
app.use(express.json());

// Health check route
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "App API is running!",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);

// Protected routes
app.use("/api/users", verifyToken, userRouter);
app.use("/api/notifications", verifyToken, notificationRouter);
app.use("/api/events", verifyToken, eventRouter);
app.use("/api/invites", verifyToken, inviteRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
