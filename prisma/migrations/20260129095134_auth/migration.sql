/*
  Warnings:

  - You are about to drop the column `payload` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `read` on the `UserNotification` table. All the data in the column will be lost.
  - You are about to drop the `_NotificationToUser` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "EventState" AS ENUM ('OPEN_FOR_REGISTRATION', 'CLOSED_FOR_REGISTRATION', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventRole" AS ENUM ('ATTENDEE', 'MANAGER', 'OWNER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REMINDER', 'INVITE', 'CANCELLATION');

-- DropForeignKey
ALTER TABLE "_NotificationToUser" DROP CONSTRAINT "_NotificationToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_NotificationToUser" DROP CONSTRAINT "_NotificationToUser_B_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "payload",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" VARCHAR(100) NOT NULL,
ADD COLUMN     "profileImageUrl" VARCHAR(255);

-- AlterTable
ALTER TABLE "UserNotification" DROP COLUMN "read",
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "_NotificationToUser";

-- CreateTable
CREATE TABLE "ReminderNotification" (
    "eventId" INTEGER NOT NULL,
    "id" INTEGER NOT NULL,

    CONSTRAINT "ReminderNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancellationNotification" (
    "eventId" INTEGER NOT NULL,
    "id" INTEGER NOT NULL,

    CONSTRAINT "CancellationNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteNotification" (
    "eventId" INTEGER NOT NULL,
    "role" "EventRole" NOT NULL,
    "senderId" INTEGER NOT NULL,
    "id" INTEGER NOT NULL,

    CONSTRAINT "InviteNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "price" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "duration" SMALLINT NOT NULL,
    "maxAttendees" INTEGER NOT NULL,
    "imageUrl" VARCHAR(255),
    "visibility" "Visibility" NOT NULL,
    "state" "EventState" NOT NULL DEFAULT 'OPEN_FOR_REGISTRATION',
    "ownerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_name_idx" ON "Event"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- AddForeignKey
ALTER TABLE "ReminderNotification" ADD CONSTRAINT "ReminderNotification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderNotification" ADD CONSTRAINT "ReminderNotification_id_fkey" FOREIGN KEY ("id") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationNotification" ADD CONSTRAINT "CancellationNotification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationNotification" ADD CONSTRAINT "CancellationNotification_id_fkey" FOREIGN KEY ("id") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteNotification" ADD CONSTRAINT "InviteNotification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteNotification" ADD CONSTRAINT "InviteNotification_id_fkey" FOREIGN KEY ("id") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
