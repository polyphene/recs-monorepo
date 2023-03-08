/*
  Warnings:

  - You are about to drop the column `eventId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `transactionHash` on the `Event` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Event_eventId_key";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "eventId",
DROP COLUMN "transactionHash";
