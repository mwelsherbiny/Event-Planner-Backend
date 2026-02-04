import { NotificationTarget, NotificationType } from "@prisma/client";
import type { CreateInviteNotificationData } from "../notification/notification.types.js";
import type { InviteData } from "./invite.types.js";
import AppError from "../../errors/AppError.js";

export function mapInviteToNotification(
  invite: InviteData,
): CreateInviteNotificationData {
  if (!invite.id) {
    throw AppError.internalError();
  }
  return {
    type: NotificationType.INVITE,
    senderId: invite.senderId,
    targetId: invite.id!,
    targetType: NotificationTarget.INVITE,
    data: {
      title: "You've been invited to an event!",
      body: `You have a new invitation to join ${invite.eventName}.`,
      eventId: invite.eventId,
      eventName: invite.eventName,
      role: invite.role,
    },
  };
}
