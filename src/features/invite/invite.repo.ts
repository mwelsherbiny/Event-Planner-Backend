import type { Permission } from "@prisma/client";
import {
  attendeeCountInclude,
  eventOmitFields,
  userOmitFields,
} from "../../config/constants.js";
import prisma from "../../integrations/db/db.config.js";
import { RoleCache } from "../../shared/util/cache.util.js";
import type { FormattedEventData } from "../event/event.types.js";
import { getEventState } from "../event/event.util.js";
import type { InviteData } from "./invite.types.js";

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

    return { ...createdInvite, role: inviteData.role };
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
};

export default InviteRepository;
