import { EventRole, Permission, Prisma } from "@prisma/client";
import prisma from "../../integrations/db/db.config.js";
import type {
  CreateEventData,
  EventSearchEntry,
  FormattedEventData,
  QueryEventsData,
  UpdateEventData,
} from "./event.types.js";
import { getEventState } from "./event.util.js";
import { RoleCache } from "../../shared/util/cache.util.js";
import {
  attendeeCountInclude,
  userOmitFields,
} from "../../config/constants.js";
import { ErrorCode } from "../../errors/error-codes.js";
import AppError from "../../errors/AppError.js";
import type { PaginationData } from "../../shared/schemas/paginationSchema.js";
import type { UUID } from "crypto";

const EventRepository = {
  create: async (createEventData: CreateEventData, ownerId: number) => {
    return await prisma.event.create({
      data: {
        ...createEventData,
        ownerId,
      },
    });
  },

  query: async (queryEventsData: QueryEventsData) => {
    const events = (await prisma.$queryRaw`
      SELECT
        e."id" as "id",
        e."ownerId" as "ownerId",
        e."name" as "name",
        e."startAt"  as "startAt",
        e."duration" as "duration",
        e."price" as "price",
        e."maxAttendees" as "maxAttendees",
        e."governorate" as "governorate",
        e."imageUrl" as "imageUrl",
        COUNT(ur."userId")::int AS "currentAttendees"
      FROM "Event" e
      LEFT JOIN "UserEventRole" ur
        ON ur."eventId" = e."id"
        AND ur."roleId" = ${RoleCache.roleIdMap.get(EventRole.ATTENDEE)}
      WHERE
        e."visibility" = 'PUBLIC'
        AND e."startAt" >= NOW()
        ${
          queryEventsData.name
            ? Prisma.sql`AND e.name ILIKE ${`%${queryEventsData.name}%`}`
            : Prisma.empty
        }
        ${
          queryEventsData.governorate
            ? Prisma.sql`AND e.governorate = ${queryEventsData.governorate}`
            : Prisma.empty
        }
      GROUP BY
        e."id"
      HAVING
        COUNT(ur."userId") < e."maxAttendees"
      ORDER BY
        ${
          queryEventsData.sortField === "price"
            ? Prisma.raw(
                `"price" ${queryEventsData.sortOrder.toUpperCase()} NULLS ${
                  queryEventsData.sortOrder === "asc" ? "FIRST" : "LAST"
                }`,
              )
            : Prisma.raw(
                `"${queryEventsData.sortField}" ${queryEventsData.sortOrder.toUpperCase()}`,
              )
        }
      LIMIT ${queryEventsData.limit}
      OFFSET ${(queryEventsData.page - 1) * queryEventsData.limit};
`) as EventSearchEntry[];

    return events;
  },

  getEventDetails: async (eventId: number, userId?: number) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        owner: {
          omit: {
            passwordHash: true,
            isVerified: true,
          },
        },
        ...(userId && {
          userRoles: {
            where: {
              userId,
              eventId,
            },
            select: {
              attendanceCode: true,
              attended: true,
            },
          },
        }),
        ...attendeeCountInclude,
      },
    });

    if (!event) {
      throw new AppError({
        message: "Event not found",
        statusCode: 404,
        code: ErrorCode.EVENT_NOT_FOUND,
      });
    }

    const { _count, userRoles, ...rest } = event;
    const currentAttendees = _count.userRoles;
    const { attendanceCode, attended } = userRoles?.[0] ?? {};

    return {
      currentAttendees,
      attendanceCode,
      attended,
      ...rest,
      state: getEventState({
        state: event.state,
        startAt: event.startAt,
        duration: event.duration,
        currentAttendees,
        maxAttendees: event.maxAttendees,
      }),
    };
  },

  getById: async (eventId: number): Promise<FormattedEventData> => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: attendeeCountInclude,
    });

    if (!event) {
      throw new AppError({
        message: "Event not found",
        statusCode: 404,
        code: ErrorCode.EVENT_NOT_FOUND,
      });
    }

    const { _count, ...rest } = event;
    const currentAttendees = _count.userRoles;

    return {
      ...rest,
      currentAttendees,
      state: getEventState({
        state: event.state,
        startAt: event.startAt,
        duration: event.duration,
        currentAttendees,
        maxAttendees: event.maxAttendees,
      }),
    };
  },

  getEventVisibilityAndOwner: async (eventId: number) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        ownerId: true,
        visibility: true,
      },
    });

    if (!event) {
      throw new AppError({
        message: "Event not found",
        statusCode: 404,
        code: ErrorCode.EVENT_NOT_FOUND,
      });
    }

    return event;
  },

  addAttendee: async (
    eventId: number,
    userId: number,
    attendanceCode: string,
  ) => {
    const result = await prisma.userEventRole.create({
      data: {
        eventId,
        userId,
        roleId: RoleCache.roleIdMap.get(EventRole.ATTENDEE)!,
        attendanceCode,
      },
    });

    return result.attendanceCode;
  },

  addManager: async (
    eventId: number,
    userId: number,
    permissions: Permission[],
  ) => {
    await prisma.userEventRole.create({
      data: {
        eventId,
        userId,
        roleId: RoleCache.roleIdMap.get(EventRole.MANAGER)!,
        permissions: {
          create: permissions.map((permission) => ({
            permission,
          })),
        },
      },
    });
  },

  hasMember: async (userId: number, eventId: number) => {
    const count = await prisma.userEventRole.count({
      where: {
        userId,
        eventId,
      },
    });

    return count > 0;
  },

  getMemberPermissions: async (userId: number, eventId: number) => {
    const user = await prisma.userEventRole.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      include: {
        permissions: {
          select: { permission: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    const userRole = RoleCache.getRoleById(user.roleId);
    const rolePermissions = RoleCache.getRolePermissions(userRole);

    const permissions = new Set<Permission>();
    for (const perm of user.permissions) {
      permissions.add(perm.permission);
    }
    for (const perm of rolePermissions) {
      permissions.add(perm);
    }

    return { userId, permissions, userRole };
  },

  listAttendees: async (eventId: number, paginationData: PaginationData) => {
    const attendees = await prisma.userEventRole.findMany({
      where: {
        eventId,
        roleId: RoleCache.getRoleId(EventRole.ATTENDEE),
      },
      select: {
        attended: true,
        verifiedAt: true,
        verifiedByUser: {
          omit: userOmitFields,
        },
        user: {
          omit: userOmitFields,
        },
      },
      skip: (paginationData.page - 1) * paginationData.limit,
      take: paginationData.limit,
    });

    return attendees.map((attendee) => ({
      ...attendee.user,
      attended: attendee.attended,
      verifiedAt: attendee.verifiedAt,
      verifier: attendee.verifiedByUser,
    }));
  },

  listManagers: async (eventId: number, paginationData: PaginationData) => {
    const managers = await prisma.userEventRole.findMany({
      where: {
        eventId,
        roleId: RoleCache.getRoleId(EventRole.MANAGER),
      },
      select: {
        user: {
          omit: userOmitFields,
        },
      },
      skip: (paginationData.page - 1) * paginationData.limit,
      take: paginationData.limit,
    });

    return managers.map((manager) => manager.user);
  },

  getAllMembersIds: async (eventId: number) => {
    const members = await prisma.userEventRole.findMany({
      where: {
        eventId,
      },
      select: {
        userId: true,
      },
    });

    return members.map((member) => member.userId);
  },

  getAllAttendeesIds: async (eventId: number) => {
    const attendees = await prisma.userEventRole.findMany({
      where: {
        eventId,
        roleId: RoleCache.getRoleId(EventRole.ATTENDEE),
      },
      select: {
        userId: true,
      },
    });

    return attendees.map((attendee) => attendee.userId);
  },

  listInvites: async (eventId: number, paginationData: PaginationData) => {
    const invites = await prisma.invite.findMany({
      where: { eventId },
      include: {
        receiver: {
          omit: userOmitFields,
        },
      },
      skip: (paginationData.page - 1) * paginationData.limit,
      take: paginationData.limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    return invites;
  },

  updateEvent: async (eventId: number, updateEventData: UpdateEventData) => {
    try {
      return await prisma.event.update({
        where: { id: eventId },
        data: updateEventData,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new AppError({
          message: "Event not found",
          statusCode: 404,
          code: ErrorCode.EVENT_NOT_FOUND,
        });
      }

      throw AppError.internalError();
    }
  },

  removeMember: async (eventId: number, userId: number) => {
    await prisma.userEventRole.deleteMany({
      where: {
        eventId,
        userId,
      },
    });
  },

  removeOwner: async (eventId: number) => {
    try {
      await prisma.event.update({
        where: { id: eventId },
        data: { ownerId: null },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new AppError({
          message: "Event not found",
          statusCode: 404,
          code: ErrorCode.EVENT_NOT_FOUND,
        });
      }

      throw AppError.internalError();
    }
  },

  removeAttendee: async (eventId: number, attendeeId: number) => {
    await prisma.userEventRole.deleteMany({
      where: {
        eventId,
        userId: attendeeId,
        roleId: RoleCache.getRoleId(EventRole.ATTENDEE),
      },
    });
  },

  removeManager: async (eventId: number, managerId: number) => {
    await prisma.userEventRole.deleteMany({
      where: {
        eventId,
        userId: managerId,
        roleId: RoleCache.getRoleId(EventRole.MANAGER),
      },
    });
  },

  verifyAttendance: async (
    eventId: number,
    verifierId: number,
    attendanceCode: UUID,
  ) => {
    const result = await prisma.$transaction(async (tx) => {
      const attendance = await tx.userEventRole.findUnique({
        where: { eventId_attendanceCode: { eventId, attendanceCode } },
        include: { verifiedByUser: { omit: userOmitFields } },
      });

      if (!attendance) {
        throw new AppError({
          message: "Invalid attendance code",
          statusCode: 400,
          code: ErrorCode.INVALID_DATA,
        });
      }
      if (attendance.verifiedAt) {
        throw new AppError({
          message: "Attendance already verified",
          statusCode: 400,
          code: ErrorCode.USER_ALREADY_VERIFIED,
          details: [
            {
              verifiedAt: attendance.verifiedAt,
              verifier: attendance.verifiedByUser,
            },
          ],
        });
      }

      return tx.userEventRole.update({
        where: { eventId_attendanceCode: { eventId, attendanceCode } },
        data: {
          attended: true,
          verifiedAt: new Date(),
          verifiedByUserId: verifierId,
        },
        include: { user: { omit: userOmitFields } },
      });
    });

    return {
      user: {
        ...result.user,
        attended: result.attended,
        verifiedAt: result.verifiedAt,
        verifiedByUserId: result.verifiedByUserId,
      },
    };
  },
};

export default EventRepository;
