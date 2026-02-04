/*
  Warnings:

  - You are about to drop the column `startDate` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `notificationId` on the `Invite` table. All the data in the column will be lost.
  - You are about to drop the `CancellationNotification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReminderNotification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemNotification` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `startAt` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationTarget" AS ENUM ('EVENT', 'INVITE');

-- DropForeignKey
ALTER TABLE "CancellationNotification" DROP CONSTRAINT "CancellationNotification_eventId_fkey";

-- DropForeignKey
ALTER TABLE "CancellationNotification" DROP CONSTRAINT "CancellationNotification_id_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_userId_fkey";

-- DropForeignKey
ALTER TABLE "Invite" DROP CONSTRAINT "Invite_notificationId_fkey";

-- DropForeignKey
ALTER TABLE "ReminderNotification" DROP CONSTRAINT "ReminderNotification_eventId_fkey";

-- DropForeignKey
ALTER TABLE "ReminderNotification" DROP CONSTRAINT "ReminderNotification_id_fkey";

-- DropForeignKey
ALTER TABLE "SystemNotification" DROP CONSTRAINT "SystemNotification_id_fkey";

-- DropIndex
DROP INDEX "Event_startDate_idx";

-- DropIndex
DROP INDEX "Invite_notificationId_key";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "startDate",
DROP COLUMN "userId",
ADD COLUMN     "startAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Invite" DROP COLUMN "notificationId";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "data" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "senderId" INTEGER,
ADD COLUMN     "targetId" INTEGER,
ADD COLUMN     "targetType" "NotificationTarget";

-- DropTable
DROP TABLE "CancellationNotification";

-- DropTable
DROP TABLE "ReminderNotification";

-- DropTable
DROP TABLE "SystemNotification";

-- CreateIndex
CREATE INDEX "Event_startAt_idx" ON "Event"("startAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
