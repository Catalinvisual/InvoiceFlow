/*
  Warnings:

  - You are about to drop the column `attempts` on the `EmailVerification` table. All the data in the column will be lost.
  - You are about to drop the column `codeHash` on the `EmailVerification` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `EmailVerification` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Invoice` table. All the data in the column will be lost.
  - The `status` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `reminderType` on the `InvoiceReminder` table. All the data in the column will be lost.
  - You are about to drop the column `colors` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `template` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `tone` on the `Settings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[portalUserId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `EmailVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `items` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `InvoiceReminder` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `InvoiceReminder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'VENDOR', 'CUSTOMER');

-- DropForeignKey
ALTER TABLE "InvoiceReminder" DROP CONSTRAINT "InvoiceReminder_invoiceId_fkey";

-- DropIndex
DROP INDEX "EmailVerification_expiresAt_idx";

-- DropIndex
DROP INDEX "EmailVerification_userId_idx";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "address" TEXT,
ADD COLUMN     "cui" TEXT,
ADD COLUMN     "portalUserId" TEXT,
ADD COLUMN     "regCom" TEXT;

-- AlterTable
ALTER TABLE "EmailVerification" DROP COLUMN "attempts",
DROP COLUMN "codeHash",
DROP COLUMN "usedAt",
ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "amount",
ADD COLUMN     "items" TEXT NOT NULL,
ADD COLUMN     "total" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "InvoiceReminder" DROP COLUMN "reminderType",
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "colors",
DROP COLUMN "logo",
DROP COLUMN "template",
DROP COLUMN "tone",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "bank" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "cui" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'RON',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "regCom" TEXT,
ADD COLUMN     "swift" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'VENDOR';

-- DropEnum
DROP TYPE "InvoiceStatus";

-- DropEnum
DROP TYPE "ReminderStatus";

-- CreateIndex
CREATE UNIQUE INDEX "Client_portalUserId_key" ON "Client"("portalUserId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceReminder" ADD CONSTRAINT "InvoiceReminder_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
