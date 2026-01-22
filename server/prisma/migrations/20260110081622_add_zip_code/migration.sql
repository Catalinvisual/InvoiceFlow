/*
  Warnings:

  - A unique constraint covering the columns `[userId,invoiceNumber]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "county" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "subtotal" DECIMAL(12,2),
ADD COLUMN     "vatAmount" DECIMAL(12,2),
ADD COLUMN     "vatRate" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "invoiceTemplate" TEXT NOT NULL DEFAULT 'simple',
ADD COLUMN     "zipCode" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'EUR';

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_userId_invoiceNumber_key" ON "Invoice"("userId", "invoiceNumber");
