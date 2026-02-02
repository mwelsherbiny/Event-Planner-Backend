import { Router } from "express";
import UserController from "./user.controller.js";
import validateData from "../../shared/middleware/validate.middleware.js";
import { updateUserSchema } from "./user.schema.js";
import { upload } from "../../shared/middleware/upload.middleware.js";

const userRouter = Router();

userRouter.get("/me", UserController.getCurrentUser);
userRouter.patch(
  "/me",
  upload.single("profileImage"),
  validateData(updateUserSchema),
  UserController.updateCurrentUser,
);

export default userRouter;
