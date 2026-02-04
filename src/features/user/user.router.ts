import { Router } from "express";
import UserController from "./user.controller.js";
import {
  validateData,
  validateQuery,
} from "../../shared/middleware/validate.middleware.js";
import { updateUserSchema, userQuerySchema } from "./user.schema.js";
import { upload } from "../../shared/middleware/upload.middleware.js";
import { paginationSchema } from "../../shared/schemas/paginationSchema.js";

const userRouter = Router();

userRouter.get("/me", UserController.getCurrentUser);
userRouter.get("/", validateQuery(userQuerySchema), UserController.queryUsers);
userRouter.get(
  "/me/events/attended",
  validateQuery(paginationSchema),
  UserController.getCurrentUserAttendedEvents,
);
userRouter.get(
  "/me/events/organized",
  validateQuery(paginationSchema),
  UserController.getCurrentUserOrganizedEvents,
);

userRouter.patch(
  "/me",
  upload.single("profileImage"),
  validateData(updateUserSchema),
  UserController.updateCurrentUser,
);

export default userRouter;
