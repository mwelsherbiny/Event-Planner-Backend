import {
  EventRole,
  EventState,
  EventVisibility,
  PaymentMethod,
  Permission,
} from "@prisma/client";
import { z } from "zod";
import { governorate } from "../user/user.schema.js";
import { EventSortableFields } from "./event.types.js";
import { paginationSchema } from "../../shared/schemas/paginationSchema.js";

const visibility = z.preprocess(
  (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
  z.enum(EventVisibility),
);

const paymentMethod = z.preprocess(
  (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
  z.enum(PaymentMethod),
);

export const createEventSchema = z
  .object({
    name: z.string().min(2).max(50),
    description: z.string().min(20).max(500),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    governorate,
    startAt: z.iso.datetime(),
    duration: z.coerce.number().int().positive().min(15).max(720),
    maxAttendees: z.coerce.number().int().positive().max(10000),
    imageUrl: z.url().optional(),
    visibility,
    paymentMethod,
    price: z.coerce.number().positive().optional(),
  })
  .superRefine((data, ctx) => {
    // startAt must be in the future

    if (new Date(data.startAt) <= new Date()) {
      ctx.addIssue({
        path: ["startAt"],
        code: z.ZodIssueCode.custom,
        message: "Event start time must be in the future",
        params: { code: "start_time_in_past" },
      });
    }

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
export type CreateEventRequest = z.infer<typeof createEventSchema>;

export const queryEventsSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    governorate: governorate.optional(),
    sort: z
      .enum(EventSortableFields)
      .optional()
      .default(EventSortableFields.START_AT_ASC),
  })
  .and(paginationSchema);
export type QueryEventsRequest = z.infer<typeof queryEventsSchema>;

export const eventInviteRequestSchema = z
  .object({
    receiverId: z.number().int().positive(),
    role: z.enum(EventRole),
    permissions: z.array(z.enum(Permission)).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === EventRole.ATTENDEE && data.permissions !== undefined) {
      ctx.addIssue({
        path: ["permissions"],
        code: z.ZodIssueCode.custom,
        message: "Attendees cannot have permissions",
        params: { code: "attendees_cannot_have_permissions" },
      });
    }

    if (
      data.permissions &&
      data.permissions.includes(Permission.REMOVE_MANAGERS)
    ) {
      ctx.addIssue({
        path: ["permissions"],
        code: z.ZodIssueCode.custom,
        message: "Managers cannot have this permission",
        params: { code: "managers_cannot_have_permission" },
      });
    }
  });
export type EventInviteRequest = z.infer<typeof eventInviteRequestSchema>;

export const eventUpdateSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().min(20).max(500).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    governorate: governorate.optional(),
    startAt: z.iso.datetime().optional(),
    duration: z.coerce.number().int().positive().min(15).max(720).optional(),
    maxAttendees: z.coerce.number().int().positive().max(10000).optional(),
    imageUrl: z.url().optional(),
    visibility: visibility.optional(),
    state: z.enum(EventState).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // startAt must be in the future
    if (data.startAt && new Date(data.startAt) <= new Date()) {
      ctx.addIssue({
        path: ["startAt"],
        code: z.ZodIssueCode.custom,
        message: "Event start time must be in the future",
        params: { code: "start_time_in_past" },
      });
    }
  });
export type UpdateEventRequest = z.infer<typeof eventUpdateSchema>;

export const verifyAttendanceSchema = z.object({
  attendanceCode: z.uuid(),
});
export type VerifyAttendanceRequest = z.infer<typeof verifyAttendanceSchema>;
