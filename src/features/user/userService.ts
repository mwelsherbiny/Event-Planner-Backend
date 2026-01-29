import type { User } from "@prisma/client";
import { throwUserNotFoundError } from "../../errors/authErrors.js";
import { removeSensitiveData } from "../auth/authUtil.js";
import { getUserById, updateUserRepo } from "./userRepo.js";
import type { UpdateUserData } from "./userSchema.js";

export async function getUser(userId: number) {
  const user = await getUserById(userId);
  if (!user) {
    throwUserNotFoundError();
  }

  const publicUser = removeSensitiveData(user);

  return publicUser;
}

export async function updateUserService(
  userId: number,
  updateData: UpdateUserData,
) {
  const updatedUser = await updateUserRepo(userId, updateData as Partial<User>);
  const publicUser = removeSensitiveData(updatedUser);

  return publicUser;
}
