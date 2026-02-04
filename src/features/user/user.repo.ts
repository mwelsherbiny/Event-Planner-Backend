import { EventRole, type User } from "@prisma/client";
import prisma from "../../integrations/db/db.config.js";
import type { CreateUserData } from "../auth/auth.schema.js";
import { RoleCache } from "../../shared/util/cache.util.js";
import type { PaginationData } from "../../shared/schemas/paginationSchema.js";
import {
  attendeeCountInclude,
  eventOmitFields,
  userOmitFields,
} from "../../config/constants.js";

const UserRepository = {
  getUserById: async (id: number) => {
    const user = await prisma.user.findUnique({ where: { id } });
    return user;
  },

  getUserByEmail: async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  },

  getUserByEmailOrUsername: async (email: string, username: string) => {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    return user;
  },

  queryUsersByEmail: async (
    emailQuery: string,
    page: number,
    limit: number,
  ) => {
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: emailQuery,
          mode: "insensitive",
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      omit: userOmitFields,
    });
    return users;
  },

  queryUsersByUsername: async (
    usernameQuery: string,
    page: number,
    limit: number,
  ) => {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: usernameQuery,
          mode: "insensitive",
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      omit: userOmitFields,
    });
    return users;
  },

  createUser: async (data: CreateUserData) => {
    const createdUser = await prisma.user.create({ data });
    return createdUser;
  },

  updateUserRepo: async (id: number, data: Partial<User>) => {
    return await prisma.user.update({
      where: { id },
      data,
    });
  },

  getAttendedEvents: async (userId: number, paginationData: PaginationData) => {
    const events = await prisma.event.findMany({
      where: {
        userRoles: {
          some: {
            userId,
            roleId: RoleCache.getRoleId(EventRole.ATTENDEE),
          },
        },
      },
      skip: (paginationData.page - 1) * paginationData.limit,
      take: paginationData.limit,
      omit: eventOmitFields,
      include: attendeeCountInclude,
    });

    const formattedEvents = events.map((event) => {
      const { _count, ...rest } = event;
      const currentAttendees = _count.userRoles;
      return {
        ...rest,
        currentAttendees,
      };
    });

    return formattedEvents;
  },

  getOrganizedEvents: async (
    userId: number,
    paginationData: PaginationData,
  ) => {
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            userRoles: {
              some: {
                userId,
                roleId: RoleCache.getRoleId(EventRole.MANAGER),
              },
            },
          },
        ],
      },
      skip: (paginationData.page - 1) * paginationData.limit,
      take: paginationData.limit,
      omit: eventOmitFields,
      include: attendeeCountInclude,
    });

    const formattedEvents = events.map((event) => {
      const { _count, ...rest } = event;
      const currentAttendees = _count.userRoles;
      return {
        ...rest,
        currentAttendees,
      };
    });

    return formattedEvents;
  },
};

export default UserRepository;
