/*
  Warnings:

  - A unique constraint covering the columns `[receiverId,eventId]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Invite_receiverId_eventId_key" ON "Invite"("receiverId", "eventId");
