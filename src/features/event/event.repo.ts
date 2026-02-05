import { EventRole, Permission, Prisma } from "@prisma/client";
import prisma from "../../integrations/db/db.config.js";
import type {
  CreateEventData,
  EventSearchEntry,
  FormattedEventData,
  QueryEventsData,
} from "./event.types.js";
import { getEventState } from "./event.util.js";
import { RoleCache } from "../../shared/util/cache.util.js";
import { attendeeCountInclude } from "../../config/constants.js";
import { ErrorCode } from "../../errors/error-codes.js";
import AppError from "../../errors/AppError.js";

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
      throw new AppError({
        message: "User is not a member of the event",
        statusCode: 403,
        code: ErrorCode.USER_NOT_MEMBER_OF_EVENT,
      });
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

    return { userId, permissions };
  },
};

export default EventRepository;
