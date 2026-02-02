import { Router } from "express";
import authController from "./auth.controller.js";
import validateData from "../../shared/middleware/validate.middleware.js";
import {
  createUserSchema,
  loginUserSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationOtpSchema,
  logoutSchema,
  refreshSchema,
} from "./auth.schema.js";
import { upload } from "../../shared/middleware/upload.middleware.js";

const authRouter = Router();

authRouter.post("/login", validateData(loginUserSchema), authController.login);
authRouter.post(
  "/register",
  upload.single("profileImage"),
  validateData(createUserSchema),
  authController.register,
);
authRouter.post("/logout", validateData(logoutSchema), authController.logout);
authRouter.post(
  "/refresh",
  validateData(refreshSchema),
  authController.refresh,
);
authRouter.patch(
  "/verify-user",
  validateData(verifyOtpSchema),
  authController.verifyUser,
);
authRouter.post(
  "/resend-verification-otp",
  validateData(resendVerificationOtpSchema),
  authController.resendEmailVerificationOtp,
);

// Forgot Password endpoints
authRouter.post(
  "/forgot-password",
  validateData(forgotPasswordSchema),
  authController.forgotPassword,
);
authRouter.post(
  "/verify-otp",
  validateData(verifyOtpSchema),
  authController.verifyPasswordResetOtp,
);
authRouter.post(
  "/reset-password",
  validateData(resetPasswordSchema),
  authController.resetPassword,
);

export default authRouter;
