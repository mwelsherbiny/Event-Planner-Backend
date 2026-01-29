import z from "zod";

export const JwtPayloadSchema = z.object({
  userId: z.int().positive(),
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
