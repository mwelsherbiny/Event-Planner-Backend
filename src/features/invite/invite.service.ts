import { InviteStatus } from "@prisma/client";
import NotificationService from "../notification/notification.service.js";
import InviteRepository from "./invite.repo.js";
import type { InviteData } from "./invite.types.js";
import { mapInviteToNotification } from "./invite.util.js";
import EventService from "../event/event.service.js";

const InviteService = {
  createEventInvite: async (inviteData: InviteData) => {
    // store the invite in the database
    const createdInvite = await InviteRepository.create(inviteData);
    inviteData.id = createdInvite.id;
    // send invite notification
    const inviteNotification = mapInviteToNotification(inviteData);
    await NotificationService.sendNotification(inviteNotification, [
      inviteData.receiverId,
    ]);
    return {
      ...createdInvite,
      eventName: inviteData.eventName,
    };
  },

  getInviteById: async (inviteId: number) => {
    const invite = await InviteRepository.getInviteById(inviteId);
    return invite;
  },

  getInviteDetails: async (inviteId: number, requestSenderId: number) => {
    const inviteDetails = await InviteRepository.getInviteDetails(
      inviteId,
      requestSenderId,
    );

    return inviteDetails;
  },

  acceptInvite: async (inviteId: number, userId: number) => {
    // update invite status to ACCEPTED
    const invite = await InviteRepository.respondToInvite(
      inviteId,
      userId,
      InviteStatus.ACCEPTED,
    );

    // add user with the invited role to the event with the permissions included
    const attendanceCode = await EventService.addInvitedUser(userId, invite);

    // delete the invite notification
    await NotificationService.deleteInviteNotification(inviteId);

    // return attendance code if it exists (for users invited as attendees)
    if (attendanceCode) {
      return attendanceCode;
    }
  },

  rejectInvite: async (inviteId: number, userId: number) => {
    // update invite status to DECLINED
    await InviteRepository.respondToInvite(
      inviteId,
      userId,
      InviteStatus.DECLINED,
    );

    // delete the invite notification
    await NotificationService.deleteInviteNotification(inviteId);
  },

  resendInvite: async (inviteId: number, requestSenderId: number) => {
    // update stored invite createdAt, and status to PENDING
    // only do the update for invites that are in a DECLINED status
    const updatedInvite: InviteData = await InviteRepository.resendInvite(
      inviteId,
      requestSenderId,
    );

    // send invite notification
    const inviteNotification = mapInviteToNotification(updatedInvite);
    await NotificationService.sendNotification(inviteNotification, [
      updatedInvite.receiverId,
    ]);

    return updatedInvite;
  },
};

export default InviteService;
