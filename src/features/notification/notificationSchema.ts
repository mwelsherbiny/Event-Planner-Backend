import z from "zod";

export const registerFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, "FCM token is required"),
});
