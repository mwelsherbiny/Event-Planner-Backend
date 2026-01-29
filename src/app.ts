import express from "express";
import type { Application, Request, Response } from "express";
import { config } from "./config/config.js";
import morgan from "morgan";
import errorMiddleware from "./shared/middleware/errorMiddleware.js";
import authRouter from "./features/auth/authRouter.js";
import notFoundMiddleware from "./shared/middleware/notFoundMiddleware.js";
import userRouter from "./features/user/userRouter.js";
import { verifyToken } from "./features/auth/authMiddleware.js";

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
// app.use("/api/notifications", verifyToken, notificationRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
