/*
  Warnings:

  - You are about to drop the column `userEventRoleEventId` on the `UserEventPermission` table. All the data in the column will be lost.
  - You are about to drop the column `userEventRoleUserId` on the `UserEventPermission` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserEventPermission" DROP CONSTRAINT "UserEventPermission_userEventRoleUserId_userEventRoleEvent_fkey";

-- AlterTable
ALTER TABLE "UserEventPermission" DROP COLUMN "userEventRoleEventId",
DROP COLUMN "userEventRoleUserId";

-- AddForeignKey
ALTER TABLE "UserEventPermission" ADD CONSTRAINT "UserEventPermission_userId_eventId_fkey" FOREIGN KEY ("userId", "eventId") REFERENCES "UserEventRole"("userId", "eventId") ON DELETE CASCADE ON UPDATE CASCADE;
