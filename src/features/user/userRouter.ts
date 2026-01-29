import { Router } from "express";
import userController from "./userController.js";
import validateData from "../../shared/middleware/validationMiddleware.js";
import { updateUserSchema } from "./userSchema.js";
import { upload } from "../../shared/services/multerUpload.js";

const userRouter = Router();

userRouter.get("/me", userController.getCurrentUser);
userRouter.patch(
  "/me",
  upload.single("profileImage"),
  validateData(updateUserSchema),
  userController.updateCurrentUser,
);

export default userRouter;
