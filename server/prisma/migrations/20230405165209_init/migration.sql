-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MINT', 'TRANSFER', 'LIST', 'BUY', 'REDEEM', 'GRANT_ROLE', 'REVOKE_ROLE');

-- CreateTable
CREATE TABLE "Metadata" (
    "id" SERIAL NOT NULL,
    "cid" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "energySources" TEXT NOT NULL,
    "contractDate" TEXT NOT NULL,
    "deliveryDate" TEXT NOT NULL,
    "reportingStart" TEXT NOT NULL,
    "reportingEnd" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "volumeMWh" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "minted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "tokenId" TEXT,
    "eventType" "EventType" NOT NULL,
    "data" JSONB NOT NULL,
    "blockHeight" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressRoles" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isMinter" BOOLEAN NOT NULL DEFAULT false,
    "isRedeemer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AddressRoles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_cid_key" ON "Metadata"("cid");

-- CreateIndex
CREATE UNIQUE INDEX "Event_blockHeight_transactionHash_logIndex_key" ON "Event"("blockHeight", "transactionHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "AddressRoles_address_key" ON "AddressRoles"("address");
