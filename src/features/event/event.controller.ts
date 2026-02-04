/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Request, Response, NextFunction } from "express";
import type {
  CreateEventRequest,
  EventInviteRequest,
  QueryEventsRequest,
} from "./event.schema.js";
import EventService from "./event.service.js";
import uploadImage from "../../integrations/cloudinary/imageUpload.js";
import type { EventInviteData } from "./event.types.js";

const EventController = {
  queryEvents: async (req: Request, res: Response) => {
    const eventQueryRequest = req.parsedQuery as QueryEventsRequest;

    const events = await EventService.queryEvents(eventQueryRequest);

    console.log(events);

    return res.status(200).json({ success: true, data: { events } });
  },

  getEventDetails: async (req: Request, res: Response, next: NextFunction) => {
    // TODO
  },

  listEventAttendees: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    // TODO
  },

  listEventManagers: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    // TODO
  },

  listEventInvites: async (req: Request, res: Response, next: NextFunction) => {
    // TODO
  },

  createEvent: async (req: Request, res: Response, next: NextFunction) => {
    const eventData: CreateEventRequest = req.body;
    const ownerId = req.payload!.userId;

    if (req.file) {
      const imageUrl = await uploadImage(req.file.buffer);
      eventData.imageUrl = imageUrl;
    }

    const createdEvent = await EventService.createEvent(eventData, ownerId);

    return res
      .status(201)
      .json({ success: true, data: { event: createdEvent } });
  },

  addAttendeeToEvent: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const eventId = parseInt(req.params.id!, 10);
    const userId = req.payload!.userId;

    const attendanceCode = await EventService.addAttendeeToEvent(
      eventId,
      userId,
    );

    return res.status(200).json({ success: true, data: { attendanceCode } });
  },

  inviteUserForEvent: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const eventInviteRequest: EventInviteRequest = req.body;
    const eventId = parseInt(req.params.id!, 10);
    const senderId = req.payload!.userId;

    const eventInviteData: EventInviteData = {
      ...eventInviteRequest,
      senderId,
      eventId,
    };

    const createdInvite =
      await EventService.inviteUserForEvent(eventInviteData);

    return res
      .status(200)
      .json({ success: true, data: { invite: createdInvite } });
  },

  updateEvent: async (req: Request, res: Response, next: NextFunction) => {
    // TODO
  },

  leaveEvent: async (req: Request, res: Response, next: NextFunction) => {
    // TODO
  },

  removeAttendee: async (req: Request, res: Response, next: NextFunction) => {
    // TODO
  },

  removeManager: async (req: Request, res: Response, next: NextFunction) => {
    // TODO
  },
};

export default EventController;
