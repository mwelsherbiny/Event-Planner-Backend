import type { User } from "@prisma/client";
import prisma from "../../db.js";
import type { CreateUserData } from "./userSchema.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { throwUserNotFoundError } from "../../errors/authErrors.js";
import AppError from "../../errors/AppError.js";

export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
};

export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  return user;
};

export const getUserByEmailOrUsername = async (
  email: string,
  username: string,
) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });
  return user;
};

export const createUser = async (data: CreateUserData) => {
  const createdUser = await prisma.user.create({ data });
  return createdUser;
};

export const updateUserRepo = async (id: number, data: Partial<User>) => {
  try {
    return await prisma.user.update({
      where: { id },
      data,
    });
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
      throwUserNotFoundError();
    }
    throw AppError.internalError();
  }
};
