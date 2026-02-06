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
import InviteService from "../invite/invite.service.js";
import type { PaginationData } from "../../shared/schemas/paginationSchema.js";

const EventController = {
  queryEvents: async (req: Request, res: Response) => {
    const eventQueryRequest = req.parsedQuery as QueryEventsRequest;

    const events = await EventService.queryEvents(eventQueryRequest);

    return res.status(200).json({ success: true, data: { events } });
  },

  getEventDetails: async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.payload!.userId;
    const eventId = parseInt(req.params.id!, 10);

    const eventDetails = await EventService.getEventDetails(eventId, userId);

    return res
      .status(200)
      .json({ success: true, data: { event: eventDetails } });
  },

  listEventAttendees: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const userId = req.payload!.userId;
    const eventId = parseInt(req.params.id!, 10);
    const paginationData = req.parsedQuery as PaginationData;

    const attendees = await EventService.listEventAttendees(
      eventId,
      userId,
      paginationData,
    );

    return res.status(200).json({ success: true, data: { attendees } });
  },

  listEventManagers: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const userId = req.payload!.userId;
    const eventId = parseInt(req.params.id!, 10);
    const paginationData = req.parsedQuery as PaginationData;

    const managers = await EventService.listEventManagers(
      eventId,
      userId,
      paginationData,
    );

    return res.status(200).json({ success: true, data: { managers } });
  },

  listEventInvites: async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.payload!.userId;
    const eventId = parseInt(req.params.id!, 10);
    const paginationData = req.parsedQuery as PaginationData;

    const invites = await EventService.listEventInvites(
      eventId,
      userId,
      paginationData,
    );

    return res.status(200).json({ success: true, data: { invites } });
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

  addAttendeeToPublicEvent: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const eventId = parseInt(req.params.id!, 10);
    const userId = req.payload!.userId;

    const attendanceCode = await EventService.addAttendeeToPublicEvent(
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

  resendEventInvite: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const userId = req.payload!.userId;
    const eventId = parseInt(req.params.id!, 10);
    const inviteId = parseInt(req.params.inviteId!, 10);

    const updatedInvite = await EventService.resendEventUserInvite(
      eventId,
      userId,
      inviteId,
    );

    return res.status(200).json({
      success: true,
      data: { invite: updatedInvite },
    });
  },

  updateEvent: async (req: Request, res: Response, next: NextFunction) => {
    // TODO
  },

  leaveEvent: async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.payload!.userId;
    const eventId = parseInt(req.params.id!, 10);

    await EventService.leaveEvent(eventId, userId);

    return res.status(200).json({ success: true });
  },

  removeAttendee: async (req: Request, res: Response, next: NextFunction) => {
    // TODO
  },

  removeManager: async (req: Request, res: Response, next: NextFunction) => {
    // TODO
  },
};

export default EventController;
