import type { Request, Response } from "express";
import type {
  ForgotPasswordBody,
  LoginUserBody,
  RegisterUserBody,
  ResetPasswordBody,
  VerifyOtpBody,
} from "../user/userSchema.js";
import {
  loginUser,
  logoutUser,
  refresh,
  registerUser,
  resetPassword,
  sendResetPasswordEmail,
  sendVerificationEmail,
  verifyPasswordReset,
  verifyUser,
} from "./authService.js";
import uploadImage from "../../shared/services/imageUpload.js";

const authController = {
  login: async (req: Request, res: Response) => {
    const user: LoginUserBody = req.body;

    const { accessToken, refreshToken, publicUser } = await loginUser(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: publicUser,
      },
    });
  },
  register: async (req: Request, res: Response) => {
    const user: RegisterUserBody = req.body;
    const profileImage = req.file;
    if (profileImage) {
      const profileImageUrl = await uploadImage(profileImage.buffer);
      user.profileImageUrl = profileImageUrl;
    }

    const createdUser = await registerUser(user);
    await sendVerificationEmail(createdUser.email);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user: createdUser },
    });
  },
  logout: async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;
    const { isAlreadyLoggedOut } = await logoutUser(refreshToken);

    const message = isAlreadyLoggedOut
      ? "User already logged out"
      : "User logged out successfully";
    return res.status(200).json({ success: true, message });
  },
  refresh: async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const { newAccessToken, newRefreshToken } = await refresh(refreshToken);

    return res.json({
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  },
  verifyUser: async (req: Request, res: Response) => {
    const { otpCode, email }: VerifyOtpBody = req.body;

    const { accessToken, refreshToken, isAlreadyVerified } = await verifyUser({
      email,
      otpCode,
    });

    if (isAlreadyVerified) {
      return res.status(200).json({
        success: true,
        message: "Email already verified",
      });
    }

    return res.status(201).json({
      success: true,
      message: "User verified successfully",
      data: {
        accessToken,
        refreshToken,
      },
    });
  },
  resendEmailVerificationOtp: async (req: Request, res: Response) => {
    const { email } = req.body;

    await sendVerificationEmail(email);

    return res.json({ success: true, message: "Verification code sent" });
  },
  forgotPassword: async (req: Request, res: Response) => {
    const { email }: ForgotPasswordBody = req.body;

    await sendResetPasswordEmail(email);

    return res.json({ success: true, message: "OTP sent to email" });
  },
  verifyPasswordResetOtp: async (req: Request, res: Response) => {
    const { otpCode, email } = req.body;

    const resetToken = await verifyPasswordReset({
      email,
      otpCode,
    });

    return res.status(201).json({
      success: true,
      data: {
        message: "OTP verified successfully",
        resetToken,
      },
    });
  },
  resetPassword: async (req: Request, res: Response) => {
    const { password, resetToken }: ResetPasswordBody = req.body;

    await resetPassword({ resetToken, newPassword: password });

    return res.status(201).json({
      success: true,
      message: "Password reset successfully",
    });
  },
};
export default authController;
