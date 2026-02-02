import z from "zod";
import type { User } from "@prisma/client";
import {
  emailSchema,
  governorateSchema,
  nameSchema,
  passwordSchema,
  usernameSchema,
} from "../user/user.schema.js";

export const createUserSchema = z
  .object({})
  .extend(emailSchema.shape)
  .extend(passwordSchema.shape)
  .extend(governorateSchema.shape)
  .extend(usernameSchema.shape)
  .extend(nameSchema.shape);
export type RegisterUserBody = Pick<
  User,
  "email" | "governorate" | "username" | "name"
> & {
  password: string;
  profileImageUrl?: string;
};

export type CreateUserData = Omit<RegisterUserBody, "password"> & {
  passwordHash: string;
};

const otpSchema = z.object({
  otpCode: z.string().length(6, "OTP code must be 6 digits"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const verifyOtpSchema = z
  .object({})
  .extend(otpSchema.shape)
  .extend(emailSchema.shape);
export type VerifyOtpBody = z.infer<typeof verifyOtpSchema>;

export const resetPasswordSchema = z
  .object({})
  .extend(passwordSchema.shape)
  .extend({
    resetToken: z.string().min(1, "Reset token is required"),
  });
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;

export const refreshSchema = refreshTokenSchema;
export type RefreshBody = z.infer<typeof refreshSchema>;

export const logoutSchema = refreshSchema;
export type LogoutBody = z.infer<typeof logoutSchema>;

export const forgotPasswordSchema = emailSchema;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;

export const resendVerificationOtpSchema = emailSchema;
export type ResendVerificationOtpBody = z.infer<
  typeof resendVerificationOtpSchema
>;

export const loginUserSchema = z
  .object({})
  .extend(emailSchema.shape)
  .extend(passwordSchema.shape);
export type LoginUserBody = Pick<User, "email"> & {
  password: string;
};
