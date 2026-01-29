import type { User } from "@prisma/client";

export type PublicUser = Omit<User, "passwordHash">;
