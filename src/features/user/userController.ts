import type { Request, Response } from "express";
import { getUser, updateUserService } from "./userService.js";
import type { UpdateUserData } from "./userSchema.js";
import uploadImage from "../../shared/services/imageUpload.js";

const userController = {
  getCurrentUser: async (req: Request, res: Response) => {
    const userId = req.payload!.userId;
    const publicUser = await getUser(userId);

    return res.status(200).json({ success: true, data: { user: publicUser } });
  },
  updateCurrentUser: async (req: Request, res: Response) => {
    const userId = req.payload!.userId;
    const updateData: UpdateUserData = req.body;
    if (req.file) {
      const profileImageUrl = await uploadImage(req.file.buffer);
      updateData.profileImageUrl = profileImageUrl;
    }

    const updatedUser = await updateUserService(userId, updateData);

    return res.status(200).json({ success: true, data: { user: updatedUser } });
  },
};

export default userController;
