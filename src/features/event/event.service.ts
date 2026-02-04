import EventRepository from "./event.repo.js";
import { EventState, EventVisibility, Prisma } from "@prisma/client";
import type { CreateEventRequest, QueryEventsRequest } from "./event.schema.js";
import type { CreateEventData, QueryEventsData } from "./event.types.js";
import { generateAttendanceCode } from "./event.util.js";
import { ErrorCode } from "../../errors/error-codes.js";
import AppError from "../../errors/AppError.js";

const EventService = {
  createEvent: async (
    CreateEventRequest: CreateEventRequest,
    ownerId: number,
  ) => {
    const createEventData: CreateEventData = {
      name: CreateEventRequest.name,
      description: CreateEventRequest.description,
      latitude: new Prisma.Decimal(CreateEventRequest.latitude),
      longitude: new Prisma.Decimal(CreateEventRequest.longitude),
      governorate: CreateEventRequest.governorate,
      startAt: new Date(CreateEventRequest.startAt),
      duration: CreateEventRequest.duration,
      maxAttendees: CreateEventRequest.maxAttendees,
      imageUrl: CreateEventRequest.imageUrl ?? null,
      visibility: CreateEventRequest.visibility,
      paymentMethod: CreateEventRequest.paymentMethod,
      price: CreateEventRequest.price
        ? new Prisma.Decimal(CreateEventRequest.price)
        : null,
    };

    return await EventRepository.create(createEventData, ownerId);
  },

  queryEvents: async (queryEventRequest: QueryEventsRequest) => {
    const { sort, ...rest } = queryEventRequest;

    const sortOrder = sort.startsWith("-") ? "desc" : "asc";
    const sortField = sort.replace("-", "") as "startAt" | "price";
    const queryEventData: QueryEventsData = { ...rest, sortOrder, sortField };
    return await EventRepository.query(queryEventData);
  },

  addAttendeeToEvent: async (eventId: number, userId: number) => {
    const event = await EventRepository.getById(eventId);

    if (!event) {
      throw new AppError({
        message: "Event not found",
        statusCode: 404,
        code: ErrorCode.EVENT_NOT_FOUND,
      });
    }

    if (event.visibility !== EventVisibility.PUBLIC) {
      throw new AppError({
        message: "Cannot join a private event without an invitation",
        statusCode: 403,
        code: ErrorCode.EVENT_NOT_PUBLIC,
      });
    }

    if (event.generatedState !== EventState.OPEN_FOR_REGISTRATION) {
      throw new AppError({
        message: "Event is not open for registration",
        statusCode: 403,
        code: ErrorCode.EVENT_NOT_OPEN_FOR_REGISTRATION,
      });
    }

    if (event.ownerId === userId) {
      throw new AppError({
        message: "Event owner cannot join as an attendee",
        statusCode: 400,
        code: ErrorCode.EVENT_OWNER_CANNOT_JOIN_AS_ATTENDEE,
      });
    }

    const attendanceCode = generateAttendanceCode();

    try {
      return await EventRepository.addAttendee(eventId, userId, attendanceCode);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError({
          message: "User is already an attendee of this event",
          statusCode: 400,
          code: ErrorCode.USER_ALREADY_ATTENDEE,
        });
      }
    }
  },
};

export default EventService;
