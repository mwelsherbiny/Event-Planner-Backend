import type { User } from "@prisma/client";
import { z } from "zod";
import { egyptGovernorates } from "../../config/constants.js";

const emailSchema = z.object({
  email: z.email("Invalid email"),
});

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(30, "Password must be at most 30 characters"),
});

const governorate = z.preprocess(
  (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
  z.enum(egyptGovernorates),
);
const governorateSchema = z.object({
  governorate,
});

const usernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(32, "Username must be at most 32 characters"),
});

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const otpSchema = z.object({
  otpCode: z.string().length(6, "OTP code must be 6 digits"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

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

export const loginUserSchema = z
  .object({})
  .extend(emailSchema.shape)
  .extend(passwordSchema.shape);
export type LoginUserBody = Pick<User, "email"> & {
  password: string;
};

export const verifyOtpSchema = z
  .object({})
  .extend(otpSchema.shape)
  .extend(emailSchema.shape);
export type VerifyOtpBody = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = emailSchema;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;

export const resendVerificationOtpSchema = emailSchema;
export type ResendVerificationOtpBody = z.infer<
  typeof resendVerificationOtpSchema
>;

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

export const updateUserSchema = z.object({
  governorate: governorate.optional(),
  name: nameSchema.shape.name.optional(),
  profileImageUrl: z.string().optional(),
});
export type UpdateUserData = z.infer<typeof updateUserSchema>;
