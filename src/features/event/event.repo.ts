import { EventRole, Prisma } from "@prisma/client";
import prisma from "../../integrations/db/db.config.js";
import type {
  CreateEventData,
  EventSearchEntry,
  QueryEventsData,
} from "./event.types.js";
import { getEventState } from "./event.util.js";
import { RoleCache } from "../../shared/util/cache.util.js";

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

  getById: async (eventId: number) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            userRoles: {
              where: {
                role: {
                  role: EventRole.ATTENDEE,
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      return null;
    }

    const { _count, ...rest } = event!;
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
};

export default EventRepository;
