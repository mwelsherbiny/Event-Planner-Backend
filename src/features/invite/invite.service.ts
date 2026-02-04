import AppError from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/error-codes.js";
import NotificationService from "../notification/notification.service.js";
import InviteRepository from "./invite.repo.js";
import type { InviteData } from "./invite.types.js";
import { mapInviteToNotification } from "./invite.util.js";

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
    return createdInvite;
  },

  getInviteDetails: async (inviteId: number, requestSenderId: number) => {
    const inviteDetails = await InviteRepository.getInviteDetails(
      inviteId,
      requestSenderId,
    );

    if (!inviteDetails) {
      throw new AppError({
        message: "Invite not found or access denied",
        statusCode: 404,
        code: ErrorCode.INVITE_CANNOT_VIEWED,
      });
    }

    return inviteDetails;
  },
};

export default InviteService;
