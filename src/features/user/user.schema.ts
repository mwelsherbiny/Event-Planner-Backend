import z from "zod";
import { egyptGovernorates } from "../../config/constants.js";

export const emailSchema = z.object({
  email: z.email("Invalid email"),
});

export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(30, "Password must be at most 30 characters"),
});

export const governorate = z.preprocess(
  (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
  z.enum(egyptGovernorates),
);
export const governorateSchema = z.object({
  governorate,
});

export const usernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(32, "Username must be at most 32 characters"),
});

export const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export const updateUserSchema = z.object({
  governorate: governorate.optional(),
  name: nameSchema.shape.name.optional(),
  profileImageUrl: z.string().optional(),
});
export type UpdateUserData = z.infer<typeof updateUserSchema>;
