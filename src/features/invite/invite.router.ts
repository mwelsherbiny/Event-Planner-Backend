import { Router } from "express";
import InviteController from "./invite.controller.js";

const inviteRouter = Router();

inviteRouter.get("/:id", InviteController.getInviteDetails);
inviteRouter.post("/:id/acceptance", InviteController.addInviteAcceptance);
inviteRouter.post("/:id/rejection", InviteController.addInviteRejection);

export default inviteRouter;
