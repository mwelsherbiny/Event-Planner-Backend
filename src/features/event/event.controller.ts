import type { Request, Response, NextFunction } from "express";

const EventController = {
  queryEvents: async (req: Request, res: Response, next: NextFunction) => {
    // TODO
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
    // TODO
  },

  addAttendeeToEvent: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    // TODO
  },

  inviteUserForEvent: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    // TODO
  },

  updateEvent: async (req: Request, res: Response, next: NextFunction) => {
    // TODO
  },

  removeEventMember: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    // TODO
  },
};

export default EventController;
