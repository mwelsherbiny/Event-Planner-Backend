/* eslint-disable @typescript-eslint/no-unused-vars */
import EventRepository from "./event.repo.js";
import { EventRole, EventVisibility, Permission, Prisma } from "@prisma/client";
import type { CreateEventRequest, QueryEventsRequest } from "./event.schema.js";
import {
  GeneratedEventState,
  type CreateEventData,
  type EventInviteData,
  type FormattedEventData,
  type QueryEventsData,
} from "./event.types.js";
import { generateAttendanceCode } from "./event.util.js";
import { ErrorCode } from "../../errors/error-codes.js";
import AppError from "../../errors/AppError.js";
import UserRepository from "../user/user.repo.js";
import InviteService from "../invite/invite.service.js";
import UserService from "../user/user.service.js";
import type { InviteData, StoredInviteData } from "../invite/invite.types.js";

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

  addAttendeeToPublicEvent: async (eventId: number, userId: number) => {
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

    if (event.state !== GeneratedEventState.OPEN_FOR_REGISTRATION) {
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

      throw AppError.internalError();
    }
  },

  inviteUserForEvent: async (eventInviteData: EventInviteData) => {
    // check if user is trying to invite themselves
    if (eventInviteData.senderId === eventInviteData.receiverId) {
      throw new AppError({
        message: "User cannot invite themselves to an event",
        statusCode: 400,
        code: ErrorCode.USER_CANNOT_INVITE_SELF,
      });
    }

    // check if event exists
    const event = await assertEventExists(eventInviteData.eventId);

    // check if event can accept new attendees
    // state must be open or closed and for attendees invite, it must be not full
    await assertEventStateAcceptsNewMembers(event, eventInviteData.role);

    // check if user can be invited
    await assertCanBeInvited(event, eventInviteData.receiverId);

    // check if sender has permission to invite
    const requiredPermission =
      eventInviteData.role === EventRole.ATTENDEE
        ? Permission.INVITE_ATTENDEES
        : Permission.INVITE_MANAGERS;
    await assertHasPermission(
      event,
      eventInviteData.senderId,
      requiredPermission,
    );

    const inviteData: InviteData = {
      ...eventInviteData,
      eventName: event.name,
    };

    // create the invite
    try {
      const createdInvite = await InviteService.createEventInvite(inviteData);
      return createdInvite;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError({
          message: "User has already been invited to this event",
          statusCode: 400,
          code: ErrorCode.USER_ALREADY_INVITED,
        });
      }

      throw AppError.internalError();
    }
  },

  addInvitedUser: async (userId: number, invite: StoredInviteData) => {
    if (invite.role === EventRole.ATTENDEE) {
      return await EventRepository.addAttendee(
        invite.eventId,
        userId,
        generateAttendanceCode(),
      );
    } else if (invite.role === EventRole.MANAGER) {
      await EventRepository.addManager(
        invite.eventId,
        userId,
        invite.permissions ?? [],
      );
    }
  },
};

async function assertEventStateAcceptsNewMembers(
  event: FormattedEventData,
  memberRole: EventRole,
) {
  if (
    event.state !== GeneratedEventState.OPEN_FOR_REGISTRATION &&
    event.state !== GeneratedEventState.CLOSED_FOR_REGISTRATION
  ) {
    throw new AppError({
      message: "Event is not accepting new members",
      statusCode: 400,
      code: ErrorCode.EVENT_NOT_ACCEPTING_MEMBERS,
    });
  }
  if (
    memberRole === EventRole.ATTENDEE &&
    event.currentAttendees >= event.maxAttendees
  ) {
    throw new AppError({
      message: "Event is full",
      statusCode: 400,
      code: ErrorCode.EVENT_FULL,
    });
  }
}

async function assertCanBeInvited(
  event: FormattedEventData,
  receiverId: number,
) {
  await UserService.assertUserExists(receiverId);

  const isMember = await EventRepository.hasMember(receiverId, event.id);
  if (isMember) {
    throw new AppError({
      message: "User is already a member of the event",
      statusCode: 400,
      code: ErrorCode.USER_ALREADY_MEMBER,
    });
  }
}

async function assertHasPermission(
  event: FormattedEventData,
  userId: number,
  permission: Permission,
) {
  if (event.ownerId === userId) {
    return;
  }

  const userPermissions = await EventRepository.getMemberPermissions(
    userId,
    event.id,
  );

  if (!userPermissions) {
    throw new AppError({
      message: "User is not a member of the event",
      statusCode: 403,
      code: ErrorCode.USER_NOT_MEMBER_OF_EVENT,
    });
  }

  if (!userPermissions.permissions.has(permission)) {
    throw new AppError({
      message: "User does not have permission to invite attendees",
      statusCode: 403,
      code: ErrorCode.NO_PERMISSION,
    });
  }
}

async function assertEventExists(eventId: number) {
  const event = await EventRepository.getById(eventId);
  if (!event) {
    throw new AppError({
      message: "Event not found",
      statusCode: 404,
      code: ErrorCode.EVENT_NOT_FOUND,
    });
  }

  return event;
}

export default EventService;
