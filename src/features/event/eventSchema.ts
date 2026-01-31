import { EventVisibility, PaymentMethod, Prisma } from "@prisma/client";
import { z } from "zod";
import { governorate } from "../../shared/schemas/governorateSchema.js";

const visibility = z.preprocess(
  (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
  z.enum(EventVisibility),
);

const paymentMethod = z.preprocess(
  (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
  z.enum(PaymentMethod),
);

export const eventCreationSchema = z
  .object({
    name: z.string().min(2).max(50),
    description: z.string().min(20).max(500).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    governorate,
    startTime: z.date(),
    duration: z.number().int().positive().min(15).max(720),
    maxAttendance: z.number().int().positive().max(10000).optional(),
    imageUrl: z.url().optional(),
    visibility,
    paymentMethod,
    price: z.number().positive().optional(),
  })
  .superRefine((data, ctx) => {
    // Price is present but paymentMethod is not ONLINE or AT_EVENT
    if (
      data.price !== undefined &&
      !(data.paymentMethod === "ONLINE" || data.paymentMethod === "AT_EVENT")
    ) {
      ctx.addIssue({
        path: ["price"],
        code: z.ZodIssueCode.custom,
        message: "Price is not allowed for this payment method",
        params: { code: "price_not_allowed" },
      });
    }

    // Payment method is ONLINE or AT_EVENT but price is missing
    if (
      (data.paymentMethod === "ONLINE" || data.paymentMethod === "AT_EVENT") &&
      data.price === undefined
    ) {
      ctx.addIssue({
        path: ["price"],
        code: z.ZodIssueCode.custom,
        message: "Price is required for this payment method",
        params: { code: "price_required" },
      });
    }
  });
