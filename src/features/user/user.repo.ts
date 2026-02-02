import type { User } from "@prisma/client";
import prisma from "../../integrations/db/db.config.js";
import type { CreateUserData } from "../auth/auth.schema.js";

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
  return await prisma.user.update({
    where: { id },
    data,
  });
};
