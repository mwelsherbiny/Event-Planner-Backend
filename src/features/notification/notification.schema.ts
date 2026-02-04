import z from "zod";

export const registerFcmTokenSchema = z.object({
  token: z.string().trim().min(1, "FCM token is required"),
});
