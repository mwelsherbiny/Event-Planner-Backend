import { Router } from "express";
import EventController from "./event.controller.js";
import {
  validateData,
  validateQuery,
} from "../../shared/middleware/validate.middleware.js";
import { createEventSchema, queryEventsSchema } from "./event.schema.js";
import { upload } from "../../shared/middleware/upload.middleware.js";

const eventRouter = Router();

eventRouter.get(
  "/",
  validateQuery(queryEventsSchema),
  EventController.queryEvents,
);
eventRouter.get("/:id", EventController.getEventDetails);
eventRouter.get("/:id/attendees", EventController.listEventAttendees);
eventRouter.get("/:id/managers", EventController.listEventManagers);
eventRouter.get("/:id/invites", EventController.listEventInvites);

eventRouter.post(
  "/",
  upload.single("image"),
  validateData(createEventSchema),
  EventController.createEvent,
);
eventRouter.post("/:id/attendees", EventController.addAttendeeToEvent);
eventRouter.post("/:id/invites", EventController.inviteUserForEvent);

eventRouter.patch("/:id", EventController.updateEvent);

eventRouter.delete("/:id/member/:userId", EventController.removeEventMember);

export default eventRouter;
