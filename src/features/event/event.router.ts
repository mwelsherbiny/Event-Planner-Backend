import { Router } from "express";
import EventController from "./event.controller.js";
import {
  validateData,
  validateQuery,
} from "../../shared/middleware/validate.middleware.js";
import {
  createEventSchema,
  eventInviteRequestSchema,
  eventUpdateSchema,
  queryEventsSchema,
} from "./event.schema.js";
import { upload } from "../../shared/middleware/upload.middleware.js";
import { paginationSchema } from "../../shared/schemas/paginationSchema.js";

const eventRouter = Router();

eventRouter.get(
  "/",
  validateQuery(queryEventsSchema),
  EventController.queryEvents,
);
eventRouter.get("/:id", EventController.getEventDetails);
eventRouter.get(
  "/:id/attendees",
  validateQuery(paginationSchema),
  EventController.listEventAttendees,
);
eventRouter.get(
  "/:id/managers",
  validateQuery(paginationSchema),
  EventController.listEventManagers,
);
eventRouter.get(
  "/:id/invites",
  validateQuery(paginationSchema),
  EventController.listEventInvites,
);

eventRouter.post(
  "/",
  upload.single("image"),
  validateData(createEventSchema),
  EventController.createEvent,
);
eventRouter.post("/:id/attendees", EventController.addAttendeeToPublicEvent);
eventRouter.post(
  "/:id/invites",
  validateData(eventInviteRequestSchema),
  EventController.inviteUserForEvent,
);
eventRouter.post(
  "/:id/invites/:inviteId/resend",
  EventController.resendEventInvite,
);

eventRouter.patch(
  "/:id",
  upload.single("image"),
  validateData(eventUpdateSchema),
  EventController.updateEvent,
);

eventRouter.delete("/:id/members/me", EventController.leaveEvent);
eventRouter.delete(
  "/:id/attendees/:attendeeId",
  EventController.removeAttendee,
);
eventRouter.delete("/:id/managers/:managerId", EventController.removeManager);

export default eventRouter;
