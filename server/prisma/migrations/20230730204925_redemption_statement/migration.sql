/*
  Warnings:

  - A unique constraint covering the columns `[sellerAddress,collectionId]` on the table `Listing` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Listing_sellerAddress_collectionId_key" ON "Listing"("sellerAddress", "collectionId");

-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'REDEMPTION_STATEMENT_SET';

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "redemptionStatement" TEXT;
