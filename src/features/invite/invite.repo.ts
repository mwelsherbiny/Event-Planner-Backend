import { InviteStatus, Prisma, type Permission } from "@prisma/client";
import {
  attendeeCountInclude,
  eventOmitFields,
  userOmitFields,
} from "../../config/constants.js";
import prisma from "../../integrations/db/db.config.js";
import { RoleCache } from "../../shared/util/cache.util.js";
import { getEventState } from "../event/event.util.js";
import type {
  InviteData,
  InviteRespondedStatus,
  StoredInviteData,
} from "./invite.types.js";
import { ErrorCode } from "../../errors/error-codes.js";
import AppError from "../../errors/AppError.js";

const InviteRepository = {
  create: async (inviteData: InviteData) => {
    const createdInvite = await prisma.invite.create({
      data: {
        eventId: inviteData.eventId,
        senderId: inviteData.senderId,
        receiverId: inviteData.receiverId,
        roleId: RoleCache.roleIdMap.get(inviteData.role)!,
        invitePermissions: {
          createMany: {
            data: Array.from(inviteData.permissions || []).map(
              (permission) => ({
                permission,
              }),
            ),
          },
        },
      },
    });

    const { roleId, ...rest } = createdInvite;
    const role = RoleCache.getRoleById(roleId);

    return { ...rest, role };
  },

  getInviteDetails: async (inviteId: number, requestSenderId: number) => {
    const inviteDetails = await prisma.invite.findUnique({
      where: {
        id: inviteId,
        OR: [{ senderId: requestSenderId }, { receiverId: requestSenderId }],
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        roleId: true,
        invitePermissions: true,
        event: {
          omit: eventOmitFields,
          include: attendeeCountInclude,
        },
        sender: {
          omit: userOmitFields,
        },
      },
    });

    if (!inviteDetails) {
      return null;
    }

    const { roleId, invitePermissions, ...rest } = inviteDetails;
    const role = RoleCache.getRoleById(roleId);
    const permissions = invitePermissions.map(
      (perm): Permission => perm.permission,
    );

    const { _count, ...inviteEvent } = inviteDetails.event;
    const currentAttendees = inviteDetails.event._count.userRoles;
    const formattedEvent = {
      ...inviteEvent,
      currentAttendees,
      state: getEventState({
        state: inviteDetails.event.state,
        startAt: inviteDetails.event.startAt,
        duration: inviteDetails.event.duration,
        currentAttendees,
        maxAttendees: inviteDetails.event.maxAttendees,
      }),
    };

    return {
      ...rest,
      event: formattedEvent,
      role,
      permissions,
    };
  },

  getInvite: async (
    inviteId: number,
    requestSenderId: number,
  ): Promise<StoredInviteData | null> => {
    const invite = await prisma.invite.findUnique({
      where: {
        id: inviteId,
        OR: [{ senderId: requestSenderId }, { receiverId: requestSenderId }],
      },
    });

    if (!invite) {
      return null;
    }

    const { roleId, ...rest } = invite;
    const role = RoleCache.getRoleById(roleId);

    return {
      ...rest,
      role,
    };
  },

  respondToInvite: async (
    inviteId: number,
    requestSenderId: number,
    status: InviteRespondedStatus,
  ) => {
    try {
      const invite = await prisma.invite.update({
        where: {
          id: inviteId,
          receiverId: requestSenderId,
          status: InviteStatus.PENDING,
        },
        data: {
          status,
        },
        include: {
          invitePermissions: true,
        },
      });

      const { roleId, invitePermissions, ...rest } = invite;
      const role = RoleCache.getRoleById(roleId);
      const permissions = invitePermissions.map(
        (perm): Permission => perm.permission,
      );

      return { ...rest, role, permissions };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new AppError({
          message: "Invite not found or cannot be responded to",
          statusCode: 404,
          code: ErrorCode.INVITE_CANNOT_BE_VIEWED,
        });
      }

      throw AppError.internalError();
    }
  },

  resendInvite: async (
    inviteId: number,
    requestSenderId: number,
  ): Promise<InviteData> => {
    try {
      const updatedInvite = await prisma.invite.update({
        where: {
          id: inviteId,
          senderId: requestSenderId,
          status: InviteStatus.DECLINED,
        },
        data: {
          status: InviteStatus.PENDING,
          createdAt: new Date(),
        },
        include: {
          invitePermissions: true,
          event: {
            select: {
              name: true,
            },
          },
        },
      });

      const { roleId, event, invitePermissions, ...rest } = updatedInvite;
      const role = RoleCache.getRoleById(roleId);
      const eventName = event.name;
      const permissions = invitePermissions.map(
        (perm): Permission => perm.permission,
      );

      return { ...rest, role, eventName, permissions };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new AppError({
          message: "Invite cannot be resent",
          statusCode: 400,
          code: ErrorCode.INVITE_CANNOT_BE_RESENT,
        });
      }

      throw AppError.internalError();
    }
  },
};

export default InviteRepository;
