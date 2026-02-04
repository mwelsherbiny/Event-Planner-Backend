import type { Request, Response } from "express";
import UserService from "./user.service.js";
import type { UpdateUserData, UserQueryData } from "./user.schema.js";
import uploadImage from "../../integrations/cloudinary/imageUpload.js";
import type { PaginationData } from "../../shared/schemas/paginationSchema.js";

const UserController = {
  getCurrentUser: async (req: Request, res: Response) => {
    const userId = req.payload!.userId;
    const publicUser = await UserService.getUser(userId);

    return res.status(200).json({ success: true, data: { user: publicUser } });
  },

  queryUsers: async (req: Request, res: Response) => {
    const userQueryData: UserQueryData = req.parsedQuery as UserQueryData;

    const users = await UserService.queryUsers(userQueryData);

    return res.status(200).json({ success: true, data: { users } });
  },

  getCurrentUserAttendedEvents: async (req: Request, res: Response) => {
    const userId = req.payload!.userId;
    const paginationData = req.parsedQuery as PaginationData;

    const attendedEvents = await UserService.getAttendedEvents(
      userId,
      paginationData,
    );

    return res
      .status(200)
      .json({ success: true, data: { events: attendedEvents } });
  },

  getCurrentUserOrganizedEvents: async (req: Request, res: Response) => {
    const userId = req.payload!.userId;
    const paginationData = req.parsedQuery as PaginationData;

    const organizedEvents = await UserService.getOrganizedEvents(
      userId,
      paginationData,
    );

    return res
      .status(200)
      .json({ success: true, data: { events: organizedEvents } });
  },

  updateCurrentUser: async (req: Request, res: Response) => {
    const userId = req.payload!.userId;
    const updateData: UpdateUserData = req.body;
    if (req.file) {
      const profileImageUrl = await uploadImage(req.file.buffer);
      updateData.profileImageUrl = profileImageUrl;
    }

    const updatedUser = await UserService.updateUser(userId, updateData);

    return res.status(200).json({ success: true, data: { user: updatedUser } });
  },
};

export default UserController;
