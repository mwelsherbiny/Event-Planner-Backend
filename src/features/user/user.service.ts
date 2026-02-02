import type { User } from "@prisma/client";
import { throwUserNotFoundError } from "../../errors/auth.errors.js";
import { removeSensitiveData } from "../auth/auth.util.js";
import { getUserById, updateUserRepo } from "./user.repo.js";
import type { UpdateUserData } from "./user.schema.js";

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
  const storedUser = await getUserById(userId);
  if (!storedUser) {
    throwUserNotFoundError();
  }

  const updatedUser = await updateUserRepo(userId, updateData as Partial<User>);
  const publicUser = removeSensitiveData(updatedUser);

  return publicUser;
}
