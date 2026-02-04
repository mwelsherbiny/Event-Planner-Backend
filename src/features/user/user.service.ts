import type { User } from "@prisma/client";
import { throwUserNotFoundError } from "../../errors/auth.errors.js";
import { removeSensitiveData } from "../auth/auth.util.js";
import type { UpdateUserData, UserQueryData } from "./user.schema.js";
import UserRepository from "./user.repo.js";
import type { PaginationData } from "../../shared/schemas/paginationSchema.js";

const UserService = {
  getUser: async (userId: number) => {
    const user = await UserRepository.getUserById(userId);
    if (!user) {
      throwUserNotFoundError();
    }

    const publicUser = removeSensitiveData(user);

    return publicUser;
  },

  updateUser: async (userId: number, updateData: UpdateUserData) => {
    const storedUser = await UserRepository.getUserById(userId);
    if (!storedUser) {
      throwUserNotFoundError();
    }

    const updatedUser = await UserRepository.updateUserRepo(
      userId,
      updateData as Partial<User>,
    );
    const publicUser = removeSensitiveData(updatedUser);

    return publicUser;
  },

  queryUsers: async (userQueryData: UserQueryData) => {
    if (userQueryData.q.includes("@")) {
      return await UserRepository.queryUsersByEmail(
        userQueryData.q,
        userQueryData.page,
        userQueryData.limit,
      );
    }
    return await UserRepository.queryUsersByUsername(
      userQueryData.q,
      userQueryData.page,
      userQueryData.limit,
    );
  },

  getAttendedEvents: async (userId: number, paginationData: PaginationData) => {
    const events = await UserRepository.getAttendedEvents(
      userId,
      paginationData,
    );
    return events;
  },

  getOrganizedEvents: async (
    userId: number,
    paginationData: PaginationData,
  ) => {
    const events = await UserRepository.getOrganizedEvents(
      userId,
      paginationData,
    );
    return events;
  },
};

export default UserService;
