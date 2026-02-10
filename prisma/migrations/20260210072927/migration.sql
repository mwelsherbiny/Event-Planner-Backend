/*
  Warnings:

  - A unique constraint covering the columns `[eventId,attendanceCode]` on the table `UserEventRole` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "EventRole" ADD VALUE 'OWNER';

-- AlterTable
ALTER TABLE "UserEventRole" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedByUserId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "UserEventRole_eventId_attendanceCode_key" ON "UserEventRole"("eventId", "attendanceCode");

-- AddForeignKey
ALTER TABLE "UserEventRole" ADD CONSTRAINT "UserEventRole_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
