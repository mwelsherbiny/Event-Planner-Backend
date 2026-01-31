/*
  Warnings:

  - You are about to drop the column `isRead` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "isRead";

-- AlterTable
ALTER TABLE "NotificationReceiver" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;
