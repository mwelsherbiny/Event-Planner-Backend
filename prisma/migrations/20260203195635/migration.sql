-- AlterTable
ALTER TABLE "UserEventRole" ADD COLUMN     "attendanceCode" VARCHAR(100),
ADD COLUMN     "attended" BOOLEAN DEFAULT false;
