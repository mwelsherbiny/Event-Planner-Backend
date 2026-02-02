import { Router } from "express";
import EventController from "./event.controller.js";

const eventRouter = Router();

eventRouter.get("/", EventController.queryEvents);
eventRouter.get("/:id", EventController.getEventDetails);
eventRouter.get("/:id/attendees", EventController.listEventAttendees);
eventRouter.get("/:id/managers", EventController.listEventManagers);
eventRouter.get("/:id/invites", EventController.listEventInvites);

eventRouter.post("/", EventController.createEvent);
eventRouter.post("/:id/attendees", EventController.addAttendeeToEvent);
eventRouter.post("/:id/invites", EventController.inviteUserForEvent);

eventRouter.patch("/:id", EventController.updateEvent);

eventRouter.delete("/:id/member/:userId", EventController.removeEventMember);
