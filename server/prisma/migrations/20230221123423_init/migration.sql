/*
  Warnings:

  - You are about to drop the `RecMetadata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "RecMetadata";

-- CreateTable
CREATE TABLE "Metadata" (
    "id" SERIAL NOT NULL,
    "cid" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("id")
);
