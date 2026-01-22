/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "paymentTerms" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "reminderDaysAfter1" INTEGER,
ADD COLUMN     "reminderDaysAfter2" INTEGER,
ADD COLUMN     "reminderDaysAfter3" INTEGER,
ADD COLUMN     "reminderDaysBefore" INTEGER,
ADD COLUMN     "reminderOnDueDate" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'FREE',
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'VENDOR';
