/*
  Warnings:

  - The `attendanceCode` column on the `UserEventRole` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserEventRole" DROP COLUMN "attendanceCode",
ADD COLUMN     "attendanceCode" UUID;
