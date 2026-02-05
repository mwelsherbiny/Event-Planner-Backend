-- AlterTable
ALTER TABLE "UserEventPermission" ADD COLUMN     "userEventRoleEventId" INTEGER,
ADD COLUMN     "userEventRoleUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "UserEventPermission" ADD CONSTRAINT "UserEventPermission_userEventRoleUserId_userEventRoleEvent_fkey" FOREIGN KEY ("userEventRoleUserId", "userEventRoleEventId") REFERENCES "UserEventRole"("userId", "eventId") ON DELETE SET NULL ON UPDATE CASCADE;
