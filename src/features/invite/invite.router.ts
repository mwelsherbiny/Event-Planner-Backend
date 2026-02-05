import { Router } from "express";
import InviteController from "./invite.controller.js";

const inviteRouter = Router();

inviteRouter.get("/:id", InviteController.getInviteDetails);
inviteRouter.post("/:id/acceptance", InviteController.acceptInvite);
inviteRouter.post("/:id/rejection", InviteController.rejectInvite);

export default inviteRouter;
