/*
  Warnings:

  - The primary key for the `UserEventRole` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "UserEventRole" DROP CONSTRAINT "UserEventRole_pkey",
ADD CONSTRAINT "UserEventRole_pkey" PRIMARY KEY ("userId", "eventId");
