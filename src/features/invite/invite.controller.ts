/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Request, Response, NextFunction } from "express";
import InviteService from "./invite.service.js";

const InviteController = {
  getInviteDetails: async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.payload!.userId;
    const inviteId = parseInt(req.params.id!, 10);

    const inviteDetails = await InviteService.getInviteDetails(
      inviteId,
      userId,
    );

    return res
      .status(200)
      .json({ success: true, data: { invite: inviteDetails } });
  },

  acceptInvite: async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.payload!.userId;
    const inviteId = parseInt(req.params.id!, 10);

    const attendanceCode = await InviteService.acceptInvite(inviteId, userId);

    return res.status(200).json({
      success: true,
      ...(attendanceCode && {
        data: { attendanceCode },
      }),
    });
  },

  rejectInvite: async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.payload!.userId;
    const inviteId = parseInt(req.params.id!, 10);

    await InviteService.rejectInvite(inviteId, userId);

    return res.status(200).json({
      success: true,
    });
  },
};

export default InviteController;
