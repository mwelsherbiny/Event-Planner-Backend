import EventRepository from "./event.repo.js";
import {
  EventRole,
  EventVisibility,
  NotificationType,
  Permission,
  Prisma,
} from "@prisma/client";
import type {
  CreateEventRequest,
  QueryEventsRequest,
  UpdateEventRequest,
} from "./event.schema.js";
import {
  GeneratedEventState,
  type CreateEventData,
  type EventInviteData,
  type FormattedEventData,
  type QueryEventsData,
  type UpdateEventData,
} from "./event.types.js";
import { generateAttendanceCode } from "./event.util.js";
import { ErrorCode } from "../../errors/error-codes.js";
import AppError from "../../errors/AppError.js";
import InviteService from "../invite/invite.service.js";
import UserService from "../user/user.service.js";
import type { InviteData, StoredInviteData } from "../invite/invite.types.js";
import InviteRepository from "../invite/invite.repo.js";
import type { PaginationData } from "../../shared/schemas/paginationSchema.js";
import NotificationService from "../notification/notification.service.js";
import type { CreateNotificationData } from "../notification/notification.types.js";
import type { UUID } from "crypto";

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

  getEventDetails: async (eventId: number, requestSenderId: number) => {
    // check if sender has permissions to view the event details
    const userRoleAndPermissions = await assertHasPermission(
      { eventId },
      requestSenderId,
      Permission.VIEW_EVENT,
    );

    console.log(userRoleAndPermissions);

    const eventDetails = await EventRepository.getEventDetails(
      eventId,
      requestSenderId,
    );
    const permissions = userRoleAndPermissions.permissions;
    const role = userRoleAndPermissions.role;

    return {
      ...eventDetails,
      role,
      permissions: permissions === null ? [] : Array.from(permissions),
    };
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
      {
        eventId: event.id,
        ownerId: event.ownerId,
        visibility: event.visibility,
      },
      eventInviteData.senderId,
      requiredPermission,
    );

    const inviteData: InviteData = {
      ...eventInviteData,
      eventName: event.name,
    };

    // create the invite
    const createdInvite = await InviteService.createEventInvite(inviteData);
    return createdInvite;
  },

  resendEventUserInvite: async (
    eventId: number,
    userId: number,
    inviteId: number,
  ) => {
    // check if event exists
    const event = await assertEventExists(eventId);

    // get old invite
    const oldInvite = await InviteRepository.getInviteById(inviteId);

    // check if event can accept new attendees
    // state must be open or closed and for attendees invite, it must be not full
    await assertEventStateAcceptsNewMembers(event, oldInvite.role);

    // check if user can be invited
    await assertCanBeInvited(event, oldInvite.receiverId);

    // check if sender has permission to invite
    const requiredPermission =
      oldInvite.role === EventRole.ATTENDEE
        ? Permission.INVITE_ATTENDEES
        : Permission.INVITE_MANAGERS;

    await assertHasPermission(
      {
        eventId: event.id,
        ownerId: event.ownerId,
        visibility: event.visibility,
      },
      userId,
      requiredPermission,
    );

    const updatedInvite = await InviteService.resendInvite(inviteId, userId);
    return updatedInvite;
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

  listEventAttendees: async (
    eventId: number,
    requestSenderId: number,
    paginationData: PaginationData,
  ) => {
    await assertHasPermission(
      { eventId },
      requestSenderId,
      Permission.VIEW_ATTENDEES,
    );

    return await EventRepository.listAttendees(eventId, paginationData);
  },

  listEventManagers: async (
    eventId: number,
    requestSenderId: number,
    paginationData: PaginationData,
  ) => {
    await assertHasPermission(
      { eventId },
      requestSenderId,
      Permission.VIEW_MANAGERS,
    );

    return await EventRepository.listManagers(eventId, paginationData);
  },

  listEventInvites: async (
    eventId: number,
    requestSenderId: number,
    paginationData: PaginationData,
  ) => {
    await assertHasPermission(
      { eventId },
      requestSenderId,
      Permission.VIEW_INVITES,
    );

    return await EventRepository.listInvites(eventId, paginationData);
  },

  leaveEvent: async (eventId: number, userId: number) => {
    // leaving doesn't require permissions
    // if the user is not a member of the event, it's still considered a success
    // check if user is in the userRole table or is the owner of the event
    // if the owner is leaving the event, cancel the event and notify attendees
    const event = await EventRepository.getById(eventId);

    await assertEventNotStatic(event.state);

    if (event.ownerId === userId) {
      await EventRepository.updateEvent(eventId, {
        state: GeneratedEventState.CANCELLED,
      });

      await EventRepository.removeOwner(event.id);

      await EventService.notifyEventCancellation(event);
    } else {
      await EventRepository.removeMember(eventId, userId);
    }
  },

  notifyEventCancellation: async (
    event: Pick<FormattedEventData, "id" | "name">,
  ) => {
    const membersIds = await EventRepository.getAllMembersIds(event.id);

    // skip if there are no members
    if (membersIds.length < 1) {
      return;
    }

    const notification: CreateNotificationData = {
      type: NotificationType.CANCELLATION,
      targetId: event.id,
      targetType: "EVENT",
      data: {
        eventName: event.name,
        title: "Event Cancelled",
        body: `${event.name} has been cancelled.`,
      },
    };

    await NotificationService.sendNotification(
      notification,
      membersIds as [number, ...number[]],
    );
  },

  notifyEventReminder: async (
    event: Pick<FormattedEventData, "id" | "name">,
  ) => {
    const attendeesId = await EventRepository.getAllAttendeesIds(event.id);

    // skip if there are no attendees
    if (attendeesId.length < 1) {
      return;
    }

    const notification: CreateNotificationData = {
      type: NotificationType.REMINDER,
      targetId: event.id,
      targetType: "EVENT",
      data: {
        eventName: event.name,
        title: "Event Reminder",
        body: `${event.name} is happening soon.`,
      },
    };

    await NotificationService.sendNotification(
      notification,
      attendeesId as [number, ...number[]],
    );
  },

  removeAttendee: async (
    eventId: number,
    attendeeId: number,
    requestSenderId: number,
  ) => {
    // verify that event is not static
    const event = await EventRepository.getById(eventId);
    await assertEventNotStatic(event.state);

    // if the user is trying to remove themselves, they can leave the event without needing permissions
    if (attendeeId === requestSenderId) {
      return await EventService.leaveEvent(eventId, attendeeId);
    }
    await assertHasPermission(
      { eventId, ownerId: event.ownerId, visibility: event.visibility },
      requestSenderId,
      Permission.REMOVE_REGISTERED_USERS,
    );

    await EventRepository.removeAttendee(eventId, attendeeId);
  },

  removeManager: async (
    eventId: number,
    managerId: number,
    requestSenderId: number,
  ) => {
    // verify that event is not static
    const event = await EventRepository.getById(eventId);
    await assertEventNotStatic(event.state);

    // if the user is trying to remove themselves, they can leave the event without needing permissions
    if (managerId === requestSenderId) {
      return await EventService.leaveEvent(eventId, managerId);
    }
    await assertHasPermission(
      { eventId, ownerId: event.ownerId, visibility: event.visibility },
      requestSenderId,
      Permission.REMOVE_MANAGERS,
    );

    await EventRepository.removeManager(eventId, managerId);
  },

  updateEvent: async (
    eventId: number,
    updateEventRequest: UpdateEventRequest,
    requestSenderId: number,
  ) => {
    const event = await EventRepository.getById(eventId);

    // check if trying to set max attendance to less than current attendees
    if (
      updateEventRequest.maxAttendees &&
      updateEventRequest.maxAttendees < event.currentAttendees
    ) {
      throw new AppError({
        message: "Cannot set max attendance to less than current attendees",
        statusCode: 400,
        code: ErrorCode.INVALID_MAX_ATTENDEES,
      });
    }

    // check if trying to open an event for registration while it's full
    // this is compared with the new max attendees if it's being updated, otherwise with the current max attendees
    if (
      updateEventRequest.state === GeneratedEventState.OPEN_FOR_REGISTRATION &&
      event.currentAttendees >=
        (updateEventRequest.maxAttendees ?? event.maxAttendees)
    ) {
      throw new AppError({
        message: "Cannot open event for registration because it is full",
        statusCode: 400,
        code: ErrorCode.EVENT_FULL,
      });
    }

    await assertEventNotStatic(event.state);

    await assertHasPermission(
      { eventId, ownerId: event.ownerId, visibility: event.visibility },
      requestSenderId,
      Permission.UPDATE_EVENT_DETAILS,
    );

    const updateEventData: UpdateEventData = Object.fromEntries(
      Object.entries(updateEventRequest).filter(([_, v]) => v !== undefined),
    );

    const updatedEvent = await EventRepository.updateEvent(
      eventId,
      updateEventData,
    );

    // if the event is being updated to be cancelled, notify attendees about the cancellation
    if (updateEventData.state === GeneratedEventState.CANCELLED) {
      await EventService.notifyEventCancellation(updatedEvent);
    }

    return updatedEvent;
  },

  verifyAttendance: async (
    eventId: number,
    verifierId: number,
    attendanceCode: UUID,
  ) => {
    const event = await EventRepository.getById(eventId);

    const verificationStartTime = event.startAt.getTime() - 60 * 60 * 1000; // 1 hour before event start time
    const verificationEndTime =
      event.startAt.getTime() + event.duration * 60 * 1000 + 60 * 60 * 1000; // event start time + event duration + 1 hour
    if (
      Date.now() < verificationStartTime ||
      Date.now() > verificationEndTime
    ) {
      throw new AppError({
        message:
          "Attendance can only be verified within 1 hour before and after the event",
        statusCode: 400,
        code: ErrorCode.INVALID_EVENT_STATE,
      });
    }

    await assertHasPermission(
      { eventId, ownerId: event.ownerId, visibility: event.visibility },
      verifierId,
      Permission.SCAN_CODE,
    );

    return await EventRepository.verifyAttendance(
      eventId,
      verifierId,
      attendanceCode,
    );
  },
};

async function assertEventNotStatic(eventState: GeneratedEventState) {
  if (
    eventState === GeneratedEventState.ONGOING ||
    eventState === GeneratedEventState.COMPLETED ||
    eventState === GeneratedEventState.CANCELLED
  ) {
    throw new AppError({
      message:
        "Cannot perform this action on an event that is ongoing, completed, or cancelled",
      statusCode: 400,
      code: ErrorCode.INVALID_EVENT_STATE,
    });
  }
}

async function assertHasPermission(
  event: {
    eventId: number;
    ownerId?: number | null;
    visibility?: EventVisibility;
  },
  userId: number,
  permission: Permission,
): Promise<{ permissions: Set<Permission> | null; role: EventRole | null }> {
  if (event.ownerId === undefined || event.visibility === undefined) {
    const { ownerId, visibility } =
      await EventRepository.getEventVisibilityAndOwner(event.eventId);
    event.ownerId = ownerId;
    event.visibility = visibility;
  }

  if (event.ownerId === userId) {
    return {
      role: EventRole.OWNER,
      permissions: new Set(Object.values(Permission)),
    };
  }

  if (
    event.visibility === EventVisibility.PUBLIC &&
    permission === Permission.VIEW_EVENT
  ) {
    const userPermissions = await EventRepository.getMemberPermissions(
      userId,
      event.eventId,
    );

    return {
      permissions: userPermissions?.permissions ?? new Set(),
      role: userPermissions?.userRole ?? null,
    };
  }

  const userPermissions = await EventRepository.getMemberPermissions(
    userId,
    event.eventId,
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
      message: "User does not have permission to do this action",
      statusCode: 403,
      code: ErrorCode.NO_PERMISSION,
    });
  }

  return {
    permissions: userPermissions.permissions,
    role: userPermissions.userRole,
  };
}

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

async function assertEventExists(eventId: number) {
  return await EventRepository.getById(eventId);
}

export default EventService;
