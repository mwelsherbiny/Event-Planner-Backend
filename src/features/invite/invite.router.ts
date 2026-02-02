import { Router } from "express";
import InviteController from "./invite.controller.js";

const inviteRouter = Router();

inviteRouter.get("/:id", InviteController.getInviteDetails);

inviteRouter.patch("/:id", InviteController.updateInviteDetails);

export default inviteRouter;
