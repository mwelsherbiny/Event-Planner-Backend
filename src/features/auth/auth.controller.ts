import type { Request, Response } from "express";
import type {
  ForgotPasswordBody,
  LoginUserBody,
  RegisterUserBody,
  ResetPasswordBody,
  VerifyOtpBody,
} from "../../features/auth/auth.schema.js";
import AuthService from "./auth.service.js";
import uploadImage from "../../integrations/cloudinary/imageUpload.js";

const AuthController = {
  login: async (req: Request, res: Response) => {
    const user: LoginUserBody = req.body;

    const { accessToken, refreshToken, publicUser } =
      await AuthService.loginUser(user);

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

    const createdUser = await AuthService.registerUser(user);
    await AuthService.sendVerificationEmail(createdUser.email);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user: createdUser },
    });
  },
  logout: async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;
    const { isAlreadyLoggedOut } = await AuthService.logoutUser(refreshToken);

    const message = isAlreadyLoggedOut
      ? "User already logged out"
      : "User logged out successfully";
    return res.status(200).json({ success: true, message });
  },
  refresh: async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const { newAccessToken, newRefreshToken } =
      await AuthService.refresh(refreshToken);

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

    const { accessToken, refreshToken, isAlreadyVerified } =
      await AuthService.verifyUser({
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

    await AuthService.sendVerificationEmail(email);

    return res.json({ success: true, message: "Verification code sent" });
  },
  forgotPassword: async (req: Request, res: Response) => {
    const { email }: ForgotPasswordBody = req.body;

    await AuthService.sendResetPasswordEmail(email);

    return res.json({ success: true, message: "OTP sent to email" });
  },
  verifyPasswordResetOtp: async (req: Request, res: Response) => {
    const { otpCode, email } = req.body;

    const resetToken = await AuthService.verifyPasswordReset({
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

    await AuthService.resetPassword({ resetToken, newPassword: password });

    return res.status(201).json({
      success: true,
      message: "Password reset successfully",
    });
  },
};
export default AuthController;
